package com.example.locinder;

import android.os.Bundle;
import android.webkit.WebView;
import android.net.ConnectivityManager;
import android.content.Context;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private WebView webView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = this.bridge.getWebView();

        webView.setWebViewClient(new android.webkit.WebViewClient() {
            @Override
            public void onReceivedError(WebView view,
                                        android.webkit.WebResourceRequest request,
                                        android.webkit.WebResourceError error) {

                if (request.isForMainFrame()) {
                    showOfflinePage();
                }
            }
        });

        // Check initial connection
        if (!isNetworkAvailable()) {
            showOfflinePage();
        }
    }

    private void showOfflinePage() {
        webView.loadUrl("file:///android_asset/public/offline.html");
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager =
                (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        
        if (connectivityManager != null) {
            android.net.Network network = connectivityManager.getActiveNetwork();
            android.net.NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
            
            if (capabilities != null) {
                return capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET);
            }
        }
        return false;
    }
}