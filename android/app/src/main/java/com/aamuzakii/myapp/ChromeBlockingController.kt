package com.aamuzakii.myapp

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ChromeBlockingController(
    private val getChromeMinutes: () -> Double,
    private val getCurrentForegroundPackage: () -> String?,
    private val bringToHome: () -> Unit,
) {
    private var blockerJob: Job? = null

    fun start(limitMinutes: Int) {
        try {
            blockerJob?.cancel()
            blockerJob = CoroutineScope(Dispatchers.IO).launch {
                while (isActive) {
                    try {
                        val chromeMinutes = getChromeMinutes()
                        val fg = getCurrentForegroundPackage()
                        Log.d("ChromeBlockingController", "Blocker loop: minutes=" + chromeMinutes + ", fg=" + fg)
                        if (
                            chromeMinutes >= limitMinutes &&
                            (fg == "com.android.chrome" || fg == "com.google.android.youtube")
                        ) {
                            Log.d(
                                "ChromeBlockingController",
                                "Chrome limit reached ($chromeMinutes >= $limitMinutes). Sending to home."
                            )
                            withContext(Dispatchers.Main) { bringToHome() }
                        }
                    } catch (e: Exception) {
                        Log.e("ChromeBlockingController", "Blocker loop error", e)
                    }
                    delay(500L)
                }
            }
            Log.d("ChromeBlockingController", "Chrome blocking started (limit=$limitMinutes min)")
        } catch (e: Exception) {
            Log.e("ChromeBlockingController", "Failed to start Chrome blocking", e)
        }
    }

    fun stop() {
        try {
            blockerJob?.cancel()
            blockerJob = null
            Log.d("ChromeBlockingController", "Chrome blocking stopped")
        } catch (e: Exception) {
            Log.e("ChromeBlockingController", "Failed to stop Chrome blocking", e)
        }
    }

    fun invalidate() {
        stop()
    }
}
