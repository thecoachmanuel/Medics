import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registerRootComponent } from "expo";
import { ActivityIndicator, BackHandler, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_URL =
  (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.WEB_URL) ||
  (Constants.manifest && Constants.manifest.extra && Constants.manifest.extra.WEB_URL) ||
  "https://medicsonline.ng";

const WEBVIEW_BRIDGE_SCRIPT = `
(function () {
  var RNW = window.ReactNativeWebView;
  function safeStringify(value) {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch (e) { return String(value); }
  }
  function post(type, payload) {
    try {
      if (!RNW || typeof RNW.postMessage !== 'function') return;
      RNW.postMessage(JSON.stringify({ type: type, payload: payload }));
    } catch (e) {}
  }

  window.addEventListener('error', function (event) {
    post('window_error', {
      message: event && event.message,
      filename: event && event.filename,
      lineno: event && event.lineno,
      colno: event && event.colno,
      stack: event && event.error && event.error.stack,
    });
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    post('unhandledrejection', {
      message: reason && (reason.message || safeStringify(reason)),
      stack: reason && reason.stack,
    });
  });

  (function () {
    var originalConsoleError = console.error;
    console.error = function () {
      try {
        post('console_error', { args: Array.prototype.slice.call(arguments).map(safeStringify) });
      } catch (e) {}
      if (originalConsoleError) return originalConsoleError.apply(console, arguments);
    };
  })();
})();
true;
`;

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    try {
      console.error("AppErrorBoundary", error);
    } catch (e) {}
  }

  handleReset() {
    this.setState({ error: null });
    if (typeof this.props.onReset === "function") this.props.onReset();
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineTitle}>Something went wrong</Text>
        <Text style={styles.offlineSubtitle} numberOfLines={4}>
          {String(this.state.error?.message || "Unexpected error")}
        </Text>
        <TouchableOpacity onPress={this.handleReset} style={styles.retryButton}>
          <Text style={styles.retryText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

function OfflineScreen({ onRetry }) {
  return (
    <View style={styles.offlineContainer}>
      <Text style={styles.offlineTitle}>You’re Offline</Text>
      <Text style={styles.offlineSubtitle}>Please check your internet connection.</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppContent() {
  const webviewRef = useRef(null);
  const [url] = useState(DEFAULT_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [webError, setWebError] = useState(false);
  const [webRuntimeError, setWebRuntimeError] = useState(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (webviewRef.current && canGoBack) {
          webviewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const onNavigationStateChange = useCallback((navState) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const onShouldStartLoadWithRequest = useCallback((request) => {
    return true;
  }, []);

  const onMessage = useCallback((event) => {
    const data = event?.nativeEvent?.data;
    if (!data) return;
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      return;
    }
    if (!parsed || typeof parsed !== "object") return;
    if (parsed.type === "window_error" || parsed.type === "unhandledrejection") {
      setWebRuntimeError(parsed);
    }
    if (parsed.type === "console_error") {
      try {
        console.error("WebView console.error", parsed.payload);
      } catch (e) {}
    }
  }, []);

  const webView = useMemo(() => {
    const webViewProps = {
      ref: webviewRef,
      source: { uri: url },
      onNavigationStateChange,
      onLoadStart: () => {
        setWebRuntimeError(null);
        setWebError(false);
        setLoading(true);
      },
      onLoadEnd: () => setLoading(false),
      onError: (event) => {
        setLoading(false);
        setWebError(true);
        setWebRuntimeError({
          type: "webview_error",
          payload: {
            description: event?.nativeEvent?.description,
            url: event?.nativeEvent?.url,
          },
        });
      },
      onHttpError: (event) => {
        setWebError(true);
        setWebRuntimeError({
          type: "http_error",
          payload: {
            statusCode: event?.nativeEvent?.statusCode,
            description: event?.nativeEvent?.description,
            url: event?.nativeEvent?.url,
          },
        });
      },
      javaScriptEnabled: true,
      domStorageEnabled: true,
      allowsInlineMediaPlayback: true,
      mediaPlaybackRequiresUserAction: false,
      onPermissionRequest: (event) => {
        event.grant(event.resources);
      },
      setSupportMultipleWindows: false,
      onShouldStartLoadWithRequest,
      allowsBackForwardNavigationGestures: true,
      pullToRefreshEnabled: true,
      injectedJavaScriptBeforeContentLoaded: WEBVIEW_BRIDGE_SCRIPT,
      onMessage,
      sharedCookiesEnabled: true,
      thirdPartyCookiesEnabled: true,
      mixedContentMode: "always",
    };
    return <WebView {...webViewProps} style={styles.webview} />;
  }, [url, onNavigationStateChange, onShouldStartLoadWithRequest, onMessage]);

  const handleReload = useCallback(() => webviewRef.current?.reload(), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
      {!isConnected ? (
        <OfflineScreen onRetry={handleReload} />
      ) : webError || webRuntimeError ? (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineTitle}>Unable to Load</Text>
          <Text style={styles.offlineSubtitle} numberOfLines={4}>
            {webRuntimeError?.payload?.message || webRuntimeError?.payload?.description || "There was a problem loading the page."}
          </Text>
          <TouchableOpacity onPress={handleReload} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webviewContainer}>
          {webView}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2b7de9" />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  const handleReset = useCallback(() => {
    try {
      if (Platform.OS === "android") StatusBar.setBarStyle("default");
    } catch (e) {}
  }, []);
  return (
    <SafeAreaProvider>
      <AppErrorBoundary onReset={handleReset}>
        <AppContent />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff"
  },
  offlineContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  offlineSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2b7de9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  webviewContainer: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
