package com.permissionmanager.utils

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

/**
 * Shared helpers for mapping / inspecting Android runtime permissions.
 */
object PermissionUtils {

  const val STATUS_GRANTED = "granted"
  const val STATUS_DENIED = "denied"
  const val STATUS_BLOCKED = "blocked"
  const val STATUS_UNAVAILABLE = "unavailable"
  const val STATUS_LIMITED = "limited"
  const val STATUS_NOT_DETERMINED = "not_determined"

  /** Expand a comma-separated permission group into individual Manifest permissions. */
  fun expand(permissionKey: String): List<String> {
    return permissionKey
      .split(",")
      .map { it.trim() }
      .filter { it.isNotEmpty() }
  }

  fun isGranted(context: Context, permission: String): Boolean {
    return ContextCompat.checkSelfPermission(context, permission) ==
      PackageManager.PERMISSION_GRANTED
  }

  /**
   * Notifications were auto-granted before Android 13 (API 33).
   */
  fun isLegacyNotificationGranted(permission: String): Boolean {
    return permission == android.Manifest.permission.POST_NOTIFICATIONS &&
      Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
  }

  /**
   * WRITE_EXTERNAL_STORAGE is not needed / not granted the same way on Q+.
   */
  fun isIgnoredOnCurrentSdk(permission: String): Boolean {
    if (permission == android.Manifest.permission.WRITE_EXTERNAL_STORAGE &&
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
    ) {
      return true
    }
    if (permission == android.Manifest.permission.ACCESS_BACKGROUND_LOCATION &&
      Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
    ) {
      return true
    }
    return false
  }

  fun isPermissionDeclaredInManifest(context: Context, permission: String): Boolean {
    return try {
      val info = context.packageManager.getPackageInfo(
        context.packageName,
        PackageManager.GET_PERMISSIONS,
      )
      info.requestedPermissions?.contains(permission) == true
    } catch (_: Exception) {
      false
    }
  }

  fun pickWorstStatus(statuses: Collection<String>): String {
    val order = listOf(
      STATUS_UNAVAILABLE,
      STATUS_BLOCKED,
      STATUS_DENIED,
      STATUS_NOT_DETERMINED,
      STATUS_LIMITED,
      STATUS_GRANTED,
    )
    return statuses.minByOrNull { order.indexOf(it).let { i -> if (i < 0) 0 else i } }
      ?: STATUS_UNAVAILABLE
  }
}
