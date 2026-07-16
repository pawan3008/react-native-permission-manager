#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNPermissionManagerSpec/RNPermissionManagerSpec.h>
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * TurboModule / bridge entry point.
 * Permission logic lives in PermissionManagerImpl (Swift).
 */
@interface PermissionManager : NSObject <RCTBridgeModule>

@end

NS_ASSUME_NONNULL_END
