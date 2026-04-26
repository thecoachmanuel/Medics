import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registerRootComponent } from "expo";
import { ActivityIndicator, BackHandler, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { Camera } from "expo-camera";
import { Audio } from "expo-av";
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

  // Diagnostics for Media Devices
  function checkMediaDevices() {
    var diagnostics = {
      hasMediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      userAgent: navigator.userAgent,
      protocol: window.location.protocol,
      secureContext: window.isSecureContext
    };
    
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(function(devices) {
        diagnostics.devices = devices.map(function(d) { 
          return { kind: d.kind, label: d.label, id: d.deviceId }; 
        });
        post('diagnostics', diagnostics);
      }).catch(function(e) {
        diagnostics.error = e.message;
        post('diagnostics', diagnostics);
      });
    } else {
      post('diagnostics', diagnostics);
    }
  }

  window.addEventListener('load', checkMediaDevices);

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

function ErrorView({ title, message, onRetry }) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <View style={styles.errorCircle}>
          <Text style={styles.errorExclamation}>!</Text>
        </View>
      </View>
      <Text style={styles.errorTitle}>{title || "Connection Error"}</Text>
      <Text style={styles.errorSubtitle}>
        {message || "We couldn't connect to the server. Please check your internet and try again."}
      </Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton} activeOpacity={0.8}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function OfflineScreen({ onRetry }) {
  return (
    <ErrorView 
      title="You’re Offline" 
      message="It looks like you're not connected to the internet. Please check your connection and try again." 
      onRetry={onRetry} 
    />
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
    (async () => {
      try {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
          console.warn('Camera or Audio permissions not granted');
        }
      } catch (e) {
        console.error('Error requesting permissions', e);
      }
    })();
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
    if (parsed.type === "diagnostics") {
      try {
        console.log("WebView Diagnostics:", JSON.stringify(parsed.payload, null, 2));
      } catch (e) {}
    }
    if (parsed.type === "console_error") {
      try {
        console.error("WebView console.error", parsed.payload);
      } catch (e) {}
    }
  }, []);

  const handleReload = useCallback(() => webviewRef.current?.reload(), []);

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
      renderError: (errorName, errorCode, errorDesc) => (
        <ErrorView 
          title="Unable to Load" 
          message={errorDesc || "There was a problem loading the page. Please check your connection."} 
          onRetry={handleReload} 
        />
      ),
      renderLoading: () => (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2b7de9" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ),
      startInLoadingState: true,
      javaScriptEnabled: true,
      domStorageEnabled: true,
      allowsInlineMediaPlayback: true,
      mediaPlaybackRequiresUserAction: false,
      javaScriptCanOpenWindowsAutomatically: true,
      mediaCapturePermissionGrantType: "grant",
      geolocationEnabled: true,
      userAgent: Platform.OS === 'android' 
        ? 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      onPermissionRequest: (event) => {
        // Explicitly handle each resource if needed, but grant all for now
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
      androidHardwareAccelerationDisabled: false,
    };
    return <WebView {...webViewProps} style={styles.webview} />;
  }, [url, onNavigationStateChange, onShouldStartLoadWithRequest, onMessage, handleReload]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
      {!isConnected ? (
        <OfflineScreen onRetry={handleReload} />
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
    backgroundColor: "#ffffff",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#ffffff",
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  errorExclamation: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#ef4444",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
    marginBottom: 32,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2b7de9",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#2b7de9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 18,
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
