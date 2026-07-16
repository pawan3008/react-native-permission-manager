import { PermissionStatus } from '../../domain/entities/PermissionStatus';
import { NativeStatus, type NativeStatusValue } from '../../utils/constants';
import { PermissionOperationError } from '../../domain/errors/PermissionOperationError';

/**
 * Maps the unified native status string into a domain `PermissionStatus`.
 */
export class PermissionStatusMapper {
  public static toDomain(nativeStatus: string): PermissionStatus {
    switch (nativeStatus as NativeStatusValue) {
      case NativeStatus.GRANTED:
        return PermissionStatus.GRANTED;
      case NativeStatus.DENIED:
        return PermissionStatus.DENIED;
      case NativeStatus.BLOCKED:
        return PermissionStatus.BLOCKED;
      case NativeStatus.LIMITED:
        return PermissionStatus.LIMITED;
      case NativeStatus.UNAVAILABLE:
        return PermissionStatus.UNAVAILABLE;
      case NativeStatus.NOT_DETERMINED:
        return PermissionStatus.NOT_DETERMINED;
      default:
        throw new PermissionOperationError(`Unknown native permission status: "${nativeStatus}"`);
    }
  }

  public static toNative(status: PermissionStatus): NativeStatusValue {
    switch (status) {
      case PermissionStatus.GRANTED:
        return NativeStatus.GRANTED;
      case PermissionStatus.DENIED:
        return NativeStatus.DENIED;
      case PermissionStatus.BLOCKED:
        return NativeStatus.BLOCKED;
      case PermissionStatus.LIMITED:
        return NativeStatus.LIMITED;
      case PermissionStatus.UNAVAILABLE:
        return NativeStatus.UNAVAILABLE;
      case PermissionStatus.NOT_DETERMINED:
        return NativeStatus.NOT_DETERMINED;
      default:
        throw new PermissionOperationError(`Unknown PermissionStatus: "${status}"`);
    }
  }

  public static canAskAgain(status: PermissionStatus): boolean {
    return status === PermissionStatus.DENIED || status === PermissionStatus.NOT_DETERMINED;
  }
}
