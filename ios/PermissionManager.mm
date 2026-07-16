#import "PermissionManager.h"
#import "PermissionManagerImpl.h"

@implementation PermissionManager {
  PermissionManagerImpl *_impl;
}

RCT_EXPORT_MODULE(RNPermissionManagerSpec)

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [PermissionManagerImpl new];
  }
  return self;
}

RCT_EXPORT_METHOD(check:(NSString *)permission
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [_impl checkPermission:permission completion:^(NSString *status) {
    resolve(status);
  }];
}

RCT_EXPORT_METHOD(request:(NSString *)permission
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [_impl requestPermission:permission completion:^(NSString *status) {
    resolve(status);
  }];
}

RCT_EXPORT_METHOD(requestMultiple:(NSArray<NSString *> *)permissions
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [_impl requestPermissions:permissions completion:^(NSDictionary<NSString *, NSString *> *statuses) {
    resolve(statuses);
  }];
}

RCT_EXPORT_METHOD(shouldShowRequestPermissionRationale:(NSString *)permission
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  resolve(@([_impl shouldShowRationaleForPermission:permission]));
}

RCT_EXPORT_METHOD(openSettings:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [_impl openAppSettings];
  resolve(nil);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePermissionManagerSpecJSI>(params);
}
#endif

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
