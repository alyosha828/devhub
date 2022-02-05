import { constants } from '@devhub/core'
import qs from 'qs'
import { ReactNode } from 'react'
import { findDOMNode } from 'react-dom'

import {
  AppLayoutProviderState,
  getAppLayout,
} from '../../components/context/LayoutContext'
import { Browser } from '../../libs/browser'
import { Linking } from '../../libs/linking'
import { Platform } from '../../libs/platform'

export function findNode(ref: any) {
  try {
    let node = ref && (ref.current || ref)

    if (node && node.getNode && node.getNode()) node = node.getNode()

    if (node && node._touchableNode) node = node._touchableNode

    if (node && node._node) node = node._node

    if (node && Platform.OS === 'web') node = findDOMNode(node)

    return node
  } catch (error) {
    console.error('Failed to find node', error, { ref })
    return null
  }
}

export function tryFocus(ref: any): boolean | null {
  try {
    const node = findNode(ref)

    if (node?.focus) {
      if (!(node.tabIndex >= 0)) node.tabIndex = -1

      node.focus({ preventScroll: true })
      return true
    }
  } catch (error) {
    console.error(error)
    return false
  }

  return null
}

export function getGitHubAppInstallUri(
  options: {
    redirectUri?: string | undefined
    suggestedTargetId?: number | string | undefined
    repositoryIds?: (number | string)[] | undefined
  } = {},
) {
  const query: Record<string, any> = {}

  const redirectUri =
    options.redirectUri ||
    (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.isElectron
      ? `${constants.APP_DEEP_LINK_SCHEMA}://`
      : Platform.OS === 'web'
      ? window.location.origin
      : '')

  if (redirectUri) query.redirect_uri = redirectUri
  if (options.repositoryIds) query.repository_ids = options.repositoryIds
  if (options.suggestedTargetId)
    query.suggested_target_id = options.suggestedTargetId

  const querystring = qs.stringify(query, {
    arrayFormat: 'brackets',
    encode: false,
  })
  const baseUri = `${constants.API_BASE_URL}/github/app/install`

  return `${baseUri}${querystring ? `?${querystring}` : ''}`
}

export async function openAppStore({
  showReviewModal,
}: { showReviewModal?: boolean } = {}) {
  try {
    if (Platform.realOS === 'android') {
      let storeUrl = `market://details?id=${constants.GOOGLEPLAY_ID}`

      if (Platform.OS === 'android' && (await Linking.canOpenURL(storeUrl))) {
        if (__DEV__) console.log(`Requested to open Play Store: ${storeUrl}`) // eslint-disable-line no-console
        await Linking.openURL(storeUrl)
        return true
      }

      storeUrl = `https://play.google.com/store/apps/details?id=${constants.GOOGLEPLAY_ID}`
      if (__DEV__) console.log(`Requested to open Play Store: ${storeUrl}`) // eslint-disable-line no-console
      await Browser.openURL(storeUrl)
      return true
    }

    if (Platform.realOS === 'ios') {
      let storeUrl = `itms-apps://itunes.apple.com/app/id${constants.APPSTORE_ID}`

      if (Platform.OS === 'ios' && (await Linking.canOpenURL(storeUrl))) {
        if (__DEV__) console.log(`Requested to open App Store: ${storeUrl}`) // eslint-disable-line no-console
        await Linking.openURL(storeUrl)
        return true
      }

      storeUrl = showReviewModal
        ? `https://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=${constants.APPSTORE_ID}&pageNumber=0&sortOrdering=2&mt=8`
        : `https://itunes.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=${constants.APPSTORE_ID}&pageNumber=0&sortOrdering=2&mt=8`
      if (__DEV__) console.log(`Requested to open App Store: ${storeUrl}`) // eslint-disable-line no-console
      await Browser.openURL(storeUrl)
      return true
    }

    throw new Error(`Invalid platform: ${Platform.realOS}`)
  } catch (error) {
    if (__DEV__) console.error(`Failed to open App Store: ${error}`) // eslint-disable-line no-console
    return false
  }
}

export function genericParseText<T extends string>(
  text: string,
  pattern: RegExp,
  fn: (match: T) => ReactNode,
) {
  if (!(text && typeof text === 'string')) return [text].filter(Boolean)

  const matches = text.match(new RegExp(pattern, 'g')) as T[]
  if (!(matches && matches.length)) return [text].filter(Boolean)

  return text.split(pattern).reduce((result, item, index) => {
    if (!matches[index]) return result.concat([item].filter(Boolean))

    return result.concat([item, fn(matches[index])].filter(Boolean))
  }, [] as ReactNode[])
}

export function isBigEnoughForMultiColumnView(
  sizename?: AppLayoutProviderState['sizename'],
) {
  return (sizename || getAppLayout().sizename) >= '2-medium'
}

export function vibrateHapticFeedback() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const ReactNativeHapticFeedback =
      require('react-native-haptic-feedback').default

    ReactNativeHapticFeedback.trigger('selection', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: true,
    })
  } else if (
    Platform.OS === 'web' &&
    window.navigator &&
    window.navigator.vibrate
  ) {
    window.navigator.vibrate(50)
  }
}

export function roundToEven(n: number) {
  return Math.round(n) + (Math.round(n) % 2)
}
