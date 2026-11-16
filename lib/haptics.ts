import * as Haptics from 'expo-haptics';

const ignoreUnsupported = () => undefined;

export function tickSelection() {
  Haptics.selectionAsync().catch(ignoreUnsupported);
}

export function acknowledgeLongPress() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(ignoreUnsupported);
}

export function confirmSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignoreUnsupported);
}
