package com.permissionmanager.domain

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.permissionmanager.utils.PermissionUtils
import java.util.Collections

/**
 * Android permission check / request helpers.
 */
class PermissionHandler(private val reactContext: ReactApplicationContext) {

  @Volatile
  private var requestCodeCounter = 1000

  /** Dedup undeclared-permission warnings so Logcat isn't spammed on every check. */
  private val warnedUndeclared = Collections.synchronizedSet(mutableSetOf<String>())

  fun checkPermission(permissionKey: String): String {
    val permissions = PermissionUtils.expand(permissionKey)
    if (permissions.isEmpty()) {
      return PermissionUtils.STATUS_UNAVAILABLE
    }

    val statuses = permissions.map { checkSingle(it) }
    return PermissionUtils.pickWorstStatus(statuses)
  }

  fun requestPermission(permissionKey: String, callback: (String) -> Unit) {
    requestPermissions(arrayOf(permissionKey)) { result ->
      val statuses = PermissionUtils.expand(permissionKey).map {
        result[it] ?: checkSingle(it)
      }
      callback(PermissionUtils.pickWorstStatus(statuses))
    }
  }

  fun requestPermissions(
    permissionKeys: Array<String>,
    callback: (Map<String, String>) -> Unit,
  ) {
    val expanded = permissionKeys
      .flatMap { key -> PermissionUtils.expand(key).map { perm -> key to perm } }

    val uniquePermissions = LinkedHashSet<String>()
    expanded.forEach { (_, perm) -> uniquePermissions.add(perm) }

    val already = mutableMapOf<String, String>()
    val toRequest = mutableListOf<String>()

    for (permission in uniquePermissions) {
      val status = checkSingle(permission)
      if (status == PermissionUtils.STATUS_GRANTED ||
        status == PermissionUtils.STATUS_UNAVAILABLE
      ) {
        already[permission] = status
      } else {
        toRequest.add(permission)
      }
    }

    if (toRequest.isEmpty()) {
      callback(buildGroupedResult(permissionKeys, already))
      return
    }

    UiThreadUtil.runOnUiThread {
      val activity = reactContext.currentActivity
      if (activity !is PermissionAwareActivity) {
        // Cannot prompt — mark remaining as blocked/denied based on rationale.
        val fallback = already.toMutableMap()
        for (permission in toRequest) {
          fallback[permission] = if (shouldShowRationale(permission)) {
            PermissionUtils.STATUS_DENIED
          } else {
            PermissionUtils.STATUS_BLOCKED
          }
        }
        callback(buildGroupedResult(permissionKeys, fallback))
        return@runOnUiThread
      }

      val requestCode = requestCodeCounter++
      val listener = PermissionListener { code, permissions, grantResults ->
        if (code != requestCode) {
          return@PermissionListener false
        }

        val result = already.toMutableMap()
        permissions.forEachIndexed { index, permission ->
          val granted = grantResults.getOrNull(index) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
          result[permission] = when {
            granted -> PermissionUtils.STATUS_GRANTED
            shouldShowRationale(permission) -> PermissionUtils.STATUS_DENIED
            else -> PermissionUtils.STATUS_BLOCKED
          }
        }
        // Any that vanished from the callback (rare) — re-check.
        for (permission in toRequest) {
          if (!result.containsKey(permission)) {
            result[permission] = checkSingle(permission)
          }
        }
        callback(buildGroupedResult(permissionKeys, result))
        true
      }

      activity.requestPermissions(toRequest.toTypedArray(), requestCode, listener)
    }
  }

  fun shouldShowRationale(permission: String): Boolean {
    val activity = reactContext.currentActivity ?: return false
    return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
      activity.shouldShowRequestPermissionRationale(permission)
    } else {
      false
    }
  }

  fun openAppSettings() {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
      data = Uri.fromParts("package", reactContext.packageName, null)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    reactContext.startActivity(intent)
  }

  private fun checkSingle(permission: String): String {
    if (PermissionUtils.isLegacyNotificationGranted(permission)) {
      return PermissionUtils.STATUS_GRANTED
    }
    if (PermissionUtils.isIgnoredOnCurrentSdk(permission)) {
      return PermissionUtils.STATUS_GRANTED
    }
    if (!PermissionUtils.isPermissionDeclaredInManifest(reactContext, permission) &&
      permission == android.Manifest.permission.POST_NOTIFICATIONS &&
      android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.TIRAMISU
    ) {
      return PermissionUtils.STATUS_GRANTED
    }

    // Undeclared permissions can never be granted. Returning BLOCKED/DENIED here
    // silently misleads apps into "open Settings" flows; surface UNAVAILABLE and
    // a clear Logcat warning instead (e.g. "READ_MEDIA_IMAGES not declared…").
    if (!PermissionUtils.isPermissionDeclaredInManifest(reactContext, permission)) {
      warnUndeclared(permission)
      return PermissionUtils.STATUS_UNAVAILABLE
    }

    return if (PermissionUtils.isGranted(reactContext, permission)) {
      PermissionUtils.STATUS_GRANTED
    } else {
      // Without a prior request we cannot distinguish denied vs blocked.
      // Return denied; post-request flow can upgrade to blocked.
      PermissionUtils.STATUS_DENIED
    }
  }

  private fun warnUndeclared(permission: String) {
    if (!warnedUndeclared.add(permission)) {
      return
    }
    val shortName = permission.substringAfterLast('.')
    Log.w(TAG, "$shortName not declared in AndroidManifest.xml")
  }

  private fun buildGroupedResult(
    originalKeys: Array<String>,
    perPermission: Map<String, String>,
  ): Map<String, String> {
    val output = LinkedHashMap<String, String>()
    for (key in originalKeys) {
      val members = PermissionUtils.expand(key)
      val statuses = members.map { perPermission[it] ?: checkSingle(it) }
      val worst = PermissionUtils.pickWorstStatus(statuses)
      output[key] = worst
      // Also expose individual Manifest permissions for JS group mapping.
      members.forEachIndexed { index, member ->
        output[member] = statuses[index]
      }
    }
    return output
  }

  companion object {
    private const val TAG = "PermissionManager"
  }
}
