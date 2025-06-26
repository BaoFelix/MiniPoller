// ClaptureApp.cpp
// Compile as a Win32 Console Application in Visual Studio 2022
// This version integrates with MiniPoller by opening a poll creation
// page with the captured text pre-filled when the user selects "Create Poll".
#define NOMINMAX
#include <windows.h>
#include <iostream>
#include <string>
#include <algorithm>
#include <locale>
#include <sstream>

// Global variables for mouse drag state
bool g_isDragging = false;
POINT g_startPoint = { 0, 0 };
POINT g_endPoint = { 0, 0 };

// Global hook handle
HHOOK g_hMouseHook = NULL;

// Forward declarations
LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam);
DWORD WINAPI MouseHookThread(LPVOID lpParam);
void PerformCapture();
void SimulateCtrlC();
std::wstring GetClipboardText();
std::wstring URLEncode(const std::wstring &value);

// Mouse hook thread: installs the hook and processes messages.
DWORD WINAPI MouseHookThread(LPVOID lpParam)
{
    g_hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, LowLevelMouseProc, NULL, 0);
    if (g_hMouseHook == NULL) {
        std::cout << "Failed to install mouse hook!" << std::endl;
        return 1;
    }

    MSG msg;
    // Message loop is necessary for the hook to work.
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    UnhookWindowsHookEx(g_hMouseHook);
    return 0;
}

// Entry point: starts the hook thread and enters a simple command loop.
int main()
{
    // Set locale for Unicode output.
    std::setlocale(LC_ALL, "");


    // Create a thread for the mouse hook.
    HANDLE hThread = CreateThread(NULL, 0, MouseHookThread, NULL, 0, NULL);
    if (!hThread) {
        std::cout << "Failed to create mouse hook thread!" << std::endl;
        return 1;
    }

    std::cout << "Clapture App running (lightweight copy-paste capture)." << std::endl;

    // Simple loop to keep the console running until closed.
    std::cout << "Press Ctrl+C in this window to quit." << std::endl;
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        if (msg.message == WM_QUIT)
            break;
    }

    // Signal the hook thread to exit.
    PostThreadMessage(GetThreadId(hThread), WM_QUIT, 0, 0);
    WaitForSingleObject(hThread, INFINITE);
    CloseHandle(hThread);

    return 0;
}

// Low-level mouse hook callback function.
// Monitors mouse events globally.
LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam)
{
    if (nCode == HC_ACTION) {
        PMSLLHOOKSTRUCT pMouseStruct = reinterpret_cast<PMSLLHOOKSTRUCT>(lParam);
        if (pMouseStruct != nullptr) {
            if (wParam == WM_LBUTTONDOWN) {
                // Start of drag selection.
                g_isDragging = true;
                g_startPoint = pMouseStruct->pt;
            }
            else if (wParam == WM_LBUTTONUP && g_isDragging) {
                // End of drag selection.
                g_isDragging = false;
                g_endPoint = pMouseStruct->pt;

                // Define the rectangular region.
                RECT rect;
                rect.left = std::min(g_startPoint.x, g_endPoint.x);
                rect.top = std::min(g_startPoint.y, g_endPoint.y);
                rect.right = std::max(g_startPoint.x, g_endPoint.x);
                rect.bottom = std::max(g_startPoint.y, g_endPoint.y);
                int width = rect.right - rect.left;
                int height = rect.bottom - rect.top;

                // Validate region dimensions.
                if (width <= 0 || height <= 0)
                    return CallNextHookEx(g_hMouseHook, nCode, wParam, lParam);

                // Validate against screen bounds.
                int virtualLeft = GetSystemMetrics(SM_XVIRTUALSCREEN);
                int virtualTop = GetSystemMetrics(SM_YVIRTUALSCREEN);
                int virtualRight = virtualLeft + GetSystemMetrics(SM_CXVIRTUALSCREEN);
                int virtualBottom = virtualTop + GetSystemMetrics(SM_CYVIRTUALSCREEN);

                if (rect.left < virtualLeft || rect.top < virtualTop ||
                    rect.right > virtualRight || rect.bottom > virtualBottom)
                    return CallNextHookEx(g_hMouseHook, nCode, wParam, lParam);

                // Perform capture via simulated copy.
                PerformCapture();
            }
        }
    }
    return CallNextHookEx(g_hMouseHook, nCode, wParam, lParam);
}

// Performs the capture by simulating a copy (Ctrl+C) and retrieving clipboard text.
void PerformCapture()
{
    // Hide the console window so that the target application can get focus.
    HWND hConsole = GetConsoleWindow();
    ShowWindow(hConsole, SW_HIDE);

    // Determine the target window from the center of the selection.
    POINT center;
    center.x = (g_startPoint.x + g_endPoint.x) / 2;
    center.y = (g_startPoint.y + g_endPoint.y) / 2;
    HWND hTarget = WindowFromPoint(center);
    if (hTarget && hTarget != hConsole) {
        SetForegroundWindow(hTarget);
        Sleep(50); // Allow time for the target window to gain focus.
    }

    // Clear the clipboard.
    if (OpenClipboard(NULL)) {
        EmptyClipboard();
        CloseClipboard();
    }

    // Simulate Ctrl+C to trigger copy in the target app.
    SimulateCtrlC();
    Sleep(50); // Wait briefly for the clipboard to update.

    // Retrieve text from the clipboard.
    std::wstring capturedText = GetClipboardText();

    // Restore the console window.
    ShowWindow(hConsole, SW_SHOW);

    if (capturedText.empty())
        return;


    // Show a simple context menu at the cursor position.
    HMENU hMenu = CreatePopupMenu();
    AppendMenuW(hMenu, MF_STRING, 1, L"Create Poll");

    SetForegroundWindow(hConsole);
    int cmd = TrackPopupMenu(hMenu, TPM_RETURNCMD | TPM_NONOTIFY, g_endPoint.x, g_endPoint.y, 0, hConsole, NULL);
    DestroyMenu(hMenu);

    if (cmd == 1) {
        std::wstring encoded = URLEncode(capturedText);
        std::wstring url = L"http://localhost:3000/?prefill=" + encoded;
        ShellExecuteW(NULL, L"open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
    }
}

// URL-encode helper for wide strings.
std::wstring URLEncode(const std::wstring &value)
{
    std::wstringstream encoded;
    for (wchar_t c : value) {
        if ((c >= L'0' && c <= L'9') ||
            (c >= L'A' && c <= L'Z') ||
            (c >= L'a' && c <= L'z') ||
            c == L'-' || c == L'_' || c == L'.' || c == L'~') {
            encoded << c;
        } else if (c == L' ') {
            encoded << L"%20";
        } else {
            encoded << L'%';
            const char hex[] = "0123456789ABCDEF";
            encoded << hex[(c >> 4) & 0xF] << hex[c & 0xF];
        }
    }
    return encoded.str();
}

// Simulates a Ctrl+C keystroke sequence using SendInput.
void SimulateCtrlC()
{
    INPUT inputs[4] = {};

    // Press Ctrl down.
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;

    // Press 'C' down.
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 'C';

    // Release 'C'.
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'C';
    inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;

    // Release Ctrl.
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = VK_CONTROL;
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    SendInput(4, inputs, sizeof(INPUT));
}

// Retrieves Unicode text from the clipboard.
std::wstring GetClipboardText()
{
    std::wstring text;
    if (!IsClipboardFormatAvailable(CF_UNICODETEXT))
        return text;

    if (!OpenClipboard(NULL))
        return text;

    HGLOBAL hData = GetClipboardData(CF_UNICODETEXT);
    if (hData) {
        LPCWSTR pszText = static_cast<LPCWSTR>(GlobalLock(hData));
        if (pszText) {
            text = pszText;
            GlobalUnlock(hData);
        }
    }
    CloseClipboard();
    return text;
}

