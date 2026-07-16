#import "PermissionManagerImpl.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^PermissionResultBlock)(NSString *status);
typedef void (^PermissionsResultBlock)(NSDictionary<NSString *, NSString *> *statuses);

/**
 * ObjC surface for the Swift PermissionManagerImpl.
 * Actual logic lives in PermissionManagerImpl.swift.
 */
@interface PermissionManagerImpl : NSObject

- (void)checkPermission:(NSString *)permissionKey completion:(PermissionResultBlock)completion;

- (void)requestPermission:(NSString *)permissionKey completion:(PermissionResultBlock)completion;

- (void)requestPermissions:(NSArray<NSString *> *)permissionKeys
                 completion:(PermissionsResultBlock)completion;

- (BOOL)shouldShowRationaleForPermission:(NSString *)permissionKey;

- (void)openAppSettings;

@end

NS_ASSUME_NONNULL_END
