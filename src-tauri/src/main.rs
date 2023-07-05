// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{WindowBuilder, WindowUrl};
// use std::path::Path;

#[cfg(target_os = "macos")]
use winit::platform::macos::{EventLoopExtMacOS, FileOpenResult};

#[tauri::command]
fn if_file_handling() -> Option<Vec<String>> {
    let args = std::env::args().skip(1);

    let mut result = Vec::new();

    for arg in args {
        result.push(arg.to_string());
    }

    if result.len() > 0 {
        return Some(result);
    }

    return None;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![if_file_handling])
        .setup(|app| {
            WindowBuilder::new(app, "main", WindowUrl::default())
                .title("Markdown Viewer")
                .resizable(true)
                // .decorations(true)
                // .always_on_top(false)
                .inner_size(600.0, 800.0)
                .min_inner_size(400.0, 200.0)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
