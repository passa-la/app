package com.passala.countdown

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class Rings : BroadcastReceiver() {
  companion object {
    const val RING = "com.passala.countdown.RING"
    const val DONE = "com.passala.countdown.DONE"
  }

  override fun onReceive(ctx: Context, intent: Intent) {
    val id = intent.getStringExtra("id") ?: return

    when (intent.action) {
      RING -> Notes.post(
        ctx,
        Notes.ROUTINE,
        id,
        intent.getStringExtra("title") ?: "",
        intent.getStringExtra("text") ?: "",
        intent.getLongExtra("at", 0L),
        true,
      )
      DONE -> {
        Notes.cancel(ctx, Notes.ROUTINE, id)
        val prefs = ctx.getSharedPreferences(Notes.PREFS, Context.MODE_PRIVATE)
        val all = prefs.getStringSet("done", emptySet())?.toMutableSet() ?: mutableSetOf()
        all.add(id)
        prefs.edit().putStringSet("done", all).apply()
      }
    }
  }
}
