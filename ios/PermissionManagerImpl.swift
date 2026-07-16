import Foundation
import AVFoundation
import Photos
import Contacts
import CoreLocation
import UserNotifications
import EventKit
import CoreBluetooth
import UIKit

/// iOS permission checks / requests. Bridge calls into this from Obj-C++.
@objc(PermissionManagerImpl)
public final class PermissionManagerImpl: NSObject {

  private let locationManager = CLLocationManager()
  private var locationCallback: ((String) -> Void)?
  /// Remembers whether the in-flight location request was when-in-use or always.
  private var pendingLocationKey: String?
  private var bluetoothManager: CBCentralManager?
  private var bluetoothCallback: ((String) -> Void)?
  private var warnedMissingUsageKeys = Set<String>()

  @objc
  public func checkPermission(_ permissionKey: String, completion: @escaping (String) -> Void) {
    DispatchQueue.main.async {
      if permissionKey == "ios.permission.NOTIFICATIONS" {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
          let status: String
          switch settings.authorizationStatus {
          case .authorized, .provisional, .ephemeral:
            status = "granted"
          case .denied:
            status = "blocked"
          case .notDetermined:
            status = "not_determined"
          @unknown default:
            status = "unavailable"
          }
          DispatchQueue.main.async { completion(status) }
        }
        return
      }
      completion(self.status(for: permissionKey))
    }
  }

  @objc
  public func requestPermission(_ permissionKey: String, completion: @escaping (String) -> Void) {
    DispatchQueue.main.async {
      self.request(for: permissionKey, completion: completion)
    }
  }

  @objc
  public func requestPermissions(_ permissionKeys: [String], completion: @escaping ([String: String]) -> Void) {
    DispatchQueue.main.async {
      var results: [String: String] = [:]
      let group = DispatchGroup()

      for key in permissionKeys {
        group.enter()
        self.request(for: key) { status in
          results[key] = status
          group.leave()
        }
      }

      group.notify(queue: .main) {
        completion(results)
      }
    }
  }

  @objc
  public func shouldShowRationale(forPermission permissionKey: String) -> Bool {
    return false
  }

  @objc
  public func openAppSettings() {
    DispatchQueue.main.async {
      guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
      if UIApplication.shared.canOpenURL(url) {
        UIApplication.shared.open(url, options: [:], completionHandler: nil)
      }
    }
  }

  // MARK: - Status

  private func status(for key: String) -> String {
    switch key {
    case "ios.permission.CAMERA":
      return mapAVStatus(AVCaptureDevice.authorizationStatus(for: .video))
    case "ios.permission.MICROPHONE":
      return mapAVStatus(AVCaptureDevice.authorizationStatus(for: .audio))
    case "ios.permission.PHOTO_LIBRARY":
      if #available(iOS 14, *) {
        return mapPhotoStatus(PHPhotoLibrary.authorizationStatus(for: .readWrite))
      }
      return mapPhotoStatus(PHPhotoLibrary.authorizationStatus())
    case "ios.permission.CONTACTS":
      return mapContactsStatus(CNContactStore.authorizationStatus(for: .contacts))
    case "ios.permission.LOCATION_WHEN_IN_USE",
         "ios.permission.LOCATION_ALWAYS":
      return mapLocationStatus(self.currentLocationStatus(), key: key)
    case "ios.permission.CALENDAR":
      return mapEventStatus(EKEventStore.authorizationStatus(for: .event))
    case "ios.permission.BLUETOOTH":
      if #available(iOS 13.1, *) {
        switch CBCentralManager.authorization {
        case .allowedAlways: return "granted"
        case .denied: return "blocked"
        case .restricted: return "unavailable"
        case .notDetermined: return "not_determined"
        @unknown default: return "unavailable"
        }
      }
      return "unavailable"
    case "ios.permission.UNAVAILABLE":
      return "unavailable"
    default:
      return "unavailable"
    }
  }

  private func currentLocationStatus() -> CLAuthorizationStatus {
    if #available(iOS 14.0, *) {
      return locationManager.authorizationStatus
    }
    return CLLocationManager.authorizationStatus()
  }

  // MARK: - Request

  private func request(for key: String, completion: @escaping (String) -> Void) {
    // Missing Info.plist usage strings cause iOS to abort the process
    // (`abort_with_payload`). Detect early and return UNAVAILABLE with a
    // clear console warning instead — same idea as Android undeclared perms.
    if let missing = missingUsageDescription(for: key) {
      warnMissingUsageDescription(missing)
      completion("unavailable")
      return
    }

    switch key {
    case "ios.permission.CAMERA":
      let current = AVCaptureDevice.authorizationStatus(for: .video)
      if current == .notDetermined {
        // First deny → .denied → mapped to "blocked" (iOS will not re-prompt).
        AVCaptureDevice.requestAccess(for: .video) { _ in
          DispatchQueue.main.async {
            completion(self.mapAVStatus(AVCaptureDevice.authorizationStatus(for: .video)))
          }
        }
      } else {
        completion(mapAVStatus(current))
      }

    case "ios.permission.MICROPHONE":
      let current = AVCaptureDevice.authorizationStatus(for: .audio)
      if current == .notDetermined {
        AVCaptureDevice.requestAccess(for: .audio) { _ in
          DispatchQueue.main.async {
            completion(self.mapAVStatus(AVCaptureDevice.authorizationStatus(for: .audio)))
          }
        }
      } else {
        completion(mapAVStatus(current))
      }

    case "ios.permission.PHOTO_LIBRARY":
      if #available(iOS 14, *) {
        let current = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        if current == .notDetermined {
          PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
            DispatchQueue.main.async { completion(self.mapPhotoStatus(status)) }
          }
        } else {
          completion(mapPhotoStatus(current))
        }
      } else {
        let current = PHPhotoLibrary.authorizationStatus()
        if current == .notDetermined {
          PHPhotoLibrary.requestAuthorization { status in
            DispatchQueue.main.async { completion(self.mapPhotoStatus(status)) }
          }
        } else {
          completion(mapPhotoStatus(current))
        }
      }

    case "ios.permission.CONTACTS":
      // iOS reality: after the user denies the first system prompt,
      // authorizationStatus becomes `.denied` and the OS will NOT show the
      // prompt again — only Settings can re-enable. We therefore map deny →
      // "blocked" (canAskAgain=false), not "denied". Same for camera / mic /
      // photos / notifications below.
      let current = CNContactStore.authorizationStatus(for: .contacts)
      if current == .notDetermined {
        CNContactStore().requestAccess(for: .contacts) { _, _ in
          DispatchQueue.main.async {
            completion(self.mapContactsStatus(CNContactStore.authorizationStatus(for: .contacts)))
          }
        }
      } else {
        completion(mapContactsStatus(current))
      }

    case "ios.permission.LOCATION_WHEN_IN_USE":
      requestLocation(key: key, always: false, completion: completion)

    case "ios.permission.LOCATION_ALWAYS":
      requestLocation(key: key, always: true, completion: completion)

    case "ios.permission.NOTIFICATIONS":
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        switch settings.authorizationStatus {
        case .notDetermined:
          UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
              DispatchQueue.main.async { completion(granted ? "granted" : "blocked") }
            }
        case .authorized, .provisional, .ephemeral:
          DispatchQueue.main.async { completion("granted") }
        case .denied:
          DispatchQueue.main.async { completion("blocked") }
        @unknown default:
          DispatchQueue.main.async { completion("unavailable") }
        }
      }

    case "ios.permission.CALENDAR":
      let current = EKEventStore.authorizationStatus(for: .event)
      if current == .notDetermined {
        let store = EKEventStore()
        if #available(iOS 17.0, *) {
          store.requestFullAccessToEvents { granted, _ in
            DispatchQueue.main.async { completion(granted ? "granted" : "blocked") }
          }
        } else {
          store.requestAccess(to: .event) { granted, _ in
            DispatchQueue.main.async { completion(granted ? "granted" : "blocked") }
          }
        }
      } else {
        completion(mapEventStatus(current))
      }

    case "ios.permission.BLUETOOTH":
      requestBluetooth(completion: completion)

    case "ios.permission.UNAVAILABLE":
      completion("unavailable")

    default:
      completion("unavailable")
    }
  }

  private func requestLocation(key: String, always: Bool, completion: @escaping (String) -> Void) {
    let status = currentLocationStatus()
    switch status {
    case .authorizedAlways:
      completion("granted")
    case .authorizedWhenInUse:
      if always {
        pendingLocationKey = key
        locationCallback = completion
        locationManager.delegate = self
        locationManager.requestAlwaysAuthorization()
      } else {
        completion("granted")
      }
    case .notDetermined:
      pendingLocationKey = key
      locationCallback = completion
      locationManager.delegate = self
      if always {
        locationManager.requestAlwaysAuthorization()
      } else {
        locationManager.requestWhenInUseAuthorization()
      }
    case .denied:
      completion("blocked")
    case .restricted:
      completion("unavailable")
    @unknown default:
      completion("unavailable")
    }
  }

  private func requestBluetooth(completion: @escaping (String) -> Void) {
    if #available(iOS 13.1, *) {
      switch CBCentralManager.authorization {
      case .allowedAlways:
        completion("granted")
        return
      case .denied:
        completion("blocked")
        return
      case .restricted:
        completion("unavailable")
        return
      case .notDetermined:
        break
      @unknown default:
        completion("unavailable")
        return
      }
    }
    bluetoothCallback = completion
    bluetoothManager = CBCentralManager(delegate: self, queue: .main, options: [
      CBCentralManagerOptionShowPowerAlertKey: false,
    ])
  }

  // MARK: - Info.plist usage-description guards

  /// Returns the missing Info.plist key name, or nil if present / not required.
  private func missingUsageDescription(for key: String) -> String? {
    switch key {
    case "ios.permission.CAMERA":
      return missingInfoKey("NSCameraUsageDescription")
    case "ios.permission.MICROPHONE":
      return missingInfoKey("NSMicrophoneUsageDescription")
    case "ios.permission.PHOTO_LIBRARY":
      return missingInfoKey("NSPhotoLibraryUsageDescription")
    case "ios.permission.CONTACTS":
      return missingInfoKey("NSContactsUsageDescription")
    case "ios.permission.LOCATION_WHEN_IN_USE":
      return missingInfoKey("NSLocationWhenInUseUsageDescription")
    case "ios.permission.LOCATION_ALWAYS":
      // Always requires both when-in-use and always (or always+when-in-use) keys.
      if missingInfoKey("NSLocationWhenInUseUsageDescription") != nil {
        return "NSLocationWhenInUseUsageDescription"
      }
      if hasInfoKey("NSLocationAlwaysAndWhenInUseUsageDescription") ||
        hasInfoKey("NSLocationAlwaysUsageDescription")
      {
        return nil
      }
      return "NSLocationAlwaysAndWhenInUseUsageDescription"
    case "ios.permission.CALENDAR":
      if #available(iOS 17.0, *) {
        if hasInfoKey("NSCalendarsFullAccessUsageDescription") ||
          hasInfoKey("NSCalendarsUsageDescription")
        {
          return nil
        }
        return "NSCalendarsFullAccessUsageDescription"
      }
      return missingInfoKey("NSCalendarsUsageDescription")
    case "ios.permission.BLUETOOTH":
      return missingInfoKey("NSBluetoothAlwaysUsageDescription")
    default:
      return nil
    }
  }

  private func hasInfoKey(_ key: String) -> Bool {
    guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String else {
      return false
    }
    return !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }

  private func missingInfoKey(_ key: String) -> String? {
    hasInfoKey(key) ? nil : key
  }

  private func warnMissingUsageDescription(_ infoKey: String) {
    guard warnedMissingUsageKeys.insert(infoKey).inserted else { return }
    NSLog(
      "[PermissionManager] \(infoKey) not declared in Info.plist — add a usage description string or iOS will abort on request"
    )
  }

  // MARK: - Mappers

  private func mapAVStatus(_ status: AVAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "granted"
    case .denied: return "blocked"
    case .restricted: return "unavailable"
    case .notDetermined: return "not_determined"
    @unknown default: return "unavailable"
    }
  }

  private func mapPhotoStatus(_ status: PHAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "granted"
    case .limited: return "limited"
    case .denied: return "blocked"
    case .restricted: return "unavailable"
    case .notDetermined: return "not_determined"
    @unknown default: return "unavailable"
    }
  }

  private func mapContactsStatus(_ status: CNAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "granted"
    // On iOS, `.denied` means the user refused (or revoked) access and the
    // system will not show the Contacts prompt again from the app — only
    // Settings can change it. Map to "blocked" so JS `canAskAgain` is false
    // and `ensure()` can offer Open Settings.
    case .denied: return "blocked"
    case .restricted: return "unavailable"
    case .notDetermined: return "not_determined"
    default:
      // `.limited` on newer SDKs
      if #available(iOS 18.0, *), status.rawValue == CNAuthorizationStatus.limited.rawValue {
        return "limited"
      }
      return "unavailable"
    }
  }

  private func mapLocationStatus(_ status: CLAuthorizationStatus, key: String) -> String {
    switch status {
    case .authorizedAlways:
      return "granted"
    case .authorizedWhenInUse:
      return key == "ios.permission.LOCATION_ALWAYS" ? "denied" : "granted"
    case .denied:
      return "blocked"
    case .restricted:
      return "unavailable"
    case .notDetermined:
      return "not_determined"
    @unknown default:
      return "unavailable"
    }
  }

  private func mapEventStatus(_ status: EKAuthorizationStatus) -> String {
    if #available(iOS 17.0, *) {
      switch status {
      case .fullAccess: return "granted"
      case .writeOnly: return "limited"
      case .denied: return "blocked"
      case .restricted: return "unavailable"
      case .notDetermined: return "not_determined"
      case .authorized: return "granted"
      @unknown default: return "unavailable"
      }
    }
    switch status {
    case .authorized: return "granted"
    case .denied: return "blocked"
    case .restricted: return "unavailable"
    case .notDetermined: return "not_determined"
    default: return "unavailable"
    }
  }
}

extension PermissionManagerImpl: CLLocationManagerDelegate {
  public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    guard let callback = locationCallback else { return }
    let auth = currentLocationStatus()
    if auth != .notDetermined {
      let key = pendingLocationKey ?? "ios.permission.LOCATION_WHEN_IN_USE"
      locationCallback = nil
      pendingLocationKey = nil
      callback(mapLocationStatus(auth, key: key))
    }
  }

  public func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    guard let callback = locationCallback else { return }
    if status != .notDetermined {
      let key = pendingLocationKey ?? "ios.permission.LOCATION_WHEN_IN_USE"
      locationCallback = nil
      pendingLocationKey = nil
      callback(mapLocationStatus(status, key: key))
    }
  }
}

extension PermissionManagerImpl: CBCentralManagerDelegate {
  public func centralManagerDidUpdateState(_ central: CBCentralManager) {
    guard let callback = bluetoothCallback else { return }
    bluetoothCallback = nil
    if #available(iOS 13.1, *) {
      switch CBCentralManager.authorization {
      case .allowedAlways: callback("granted")
      case .denied: callback("blocked")
      case .restricted: callback("unavailable")
      case .notDetermined: callback("not_determined")
      @unknown default: callback("unavailable")
      }
    } else {
      callback(central.state == .poweredOn ? "granted" : "denied")
    }
  }
}
