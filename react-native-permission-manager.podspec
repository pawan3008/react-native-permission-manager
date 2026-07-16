require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-permission-manager"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { ios: "13.0" }
  s.source       = { git: package["repository"]["url"], tag: "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*+Private.h"
  s.swift_version = "5.0"

  s.frameworks = "AVFoundation", "Photos", "Contacts", "CoreLocation", "UserNotifications", "EventKit", "CoreBluetooth"

  if defined?(install_modules_dependencies)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
