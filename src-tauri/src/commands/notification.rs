pub mod scheduler;

#[tauri::command]
pub fn send_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    let _ = app; // Suppress unused variable warning on Linux
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        // Use notify-send directly on Linux for better reliability in some environments
        match Command::new("notify-send")
            .arg(&title)
            .arg(&body)
            .arg("-i")
            .arg("dialog-information")
            .spawn()
        {
            Ok(_) => Ok("Success: Sent via notify-send".to_string()),
            Err(e) => Err(format!("notify-send failed: {}", e)),
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        match app.notification().builder().title(title).body(body).show() {
            Ok(_) => Ok("Success".to_string()),
            Err(e) => Err(e.to_string()),
        }
    }
}
