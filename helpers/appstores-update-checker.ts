import { Alert, Linking, Platform } from 'react-native';

import VersionCheck from 'react-native-version-check';

import { iosMarketUrl, packageName, playStoreUrl } from '@/utils/utils';

const updateAppChecker = async (title, message, update, cancel) => {
  try {
    const latestVersion =
      Platform.OS === 'ios'
        ? await VersionCheck.getLatestVersion({
            provider: 'appStore',
            ignoreErrors: true,
          })
        : await VersionCheck.getLatestVersion({
            provider: 'playStore',
            packageName: packageName,
            ignoreErrors: true,
          });

    const currentVersion = VersionCheck.getCurrentVersion();

    if (latestVersion > currentVersion) {
      Alert.alert(
        title,
        message,
        [
          {
            text: update,
            onPress: () => {
              try {
                const openURL =
                  Platform.OS === 'ios' ? iosMarketUrl : playStoreUrl;

                Linking.openURL(openURL);
              } catch (error) {}
            },
          },
          {
            text: cancel,
          },
        ],
        { cancelable: true }
      );
    }
  } catch (error) {
    console.log('Error checking app version:', error);
  }
};

export default updateAppChecker;
