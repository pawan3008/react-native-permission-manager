package com.permissionmanager

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.permissionmanager.domain.PermissionHandler

/**
 * RN module entry. Forwards to [PermissionHandler].
 */
class PermissionManagerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  private val permissionHandler = PermissionHandler(reactContext)

  override fun getName(): String = NAME

  @ReactMethod
  fun check(permission: String, promise: Promise) {
    try {
      promise.resolve(permissionHandler.checkPermission(permission))
    } catch (error: Exception) {
      promise.reject("E_PERMISSION_CHECK", error.message, error)
    }
  }

  @ReactMethod
  fun request(permission: String, promise: Promise) {
    try {
      permissionHandler.requestPermission(permission) { status ->
        promise.resolve(status)
      }
    } catch (error: Exception) {
      promise.reject("E_PERMISSION_REQUEST", error.message, error)
    }
  }

  @ReactMethod
  fun requestMultiple(permissions: ReadableArray, promise: Promise) {
    try {
      val keys = Array(permissions.size()) { index ->
        permissions.getString(index) ?: ""
      }.filter { it.isNotEmpty() }.toTypedArray()

      permissionHandler.requestPermissions(keys) { result ->
        val map = Arguments.createMap()
        result.forEach { (key, value) -> map.putString(key, value) }
        promise.resolve(map)
      }
    } catch (error: Exception) {
      promise.reject("E_PERMISSION_REQUEST_MULTIPLE", error.message, error)
    }
  }

  @ReactMethod
  fun shouldShowRequestPermissionRationale(permission: String, promise: Promise) {
    try {
      // For grouped keys, rationale is true if any member needs it.
      val members = permission.split(",").map { it.trim() }.filter { it.isNotEmpty() }
      val show = members.any { permissionHandler.shouldShowRationale(it) }
      promise.resolve(show)
    } catch (error: Exception) {
      promise.reject("E_PERMISSION_RATIONALE", error.message, error)
    }
  }

  @ReactMethod
  fun openSettings(promise: Promise) {
    try {
      permissionHandler.openAppSettings()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("E_PERMISSION_SETTINGS", error.message, error)
    }
  }

  companion object {
    const val NAME = "RNPermissionManagerSpec"
  }
}
