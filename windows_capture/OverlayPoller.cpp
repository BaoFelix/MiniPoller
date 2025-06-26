#define NOMINMAX
#include <windows.h>
#include <winhttp.h>
#include <string>
#include <vector>
#include <sstream>
#include <locale>
#include <algorithm>
#pragma comment(lib, "winhttp.lib")

bool g_isDragging = false;
POINT g_startPoint{0,0};
POINT g_endPoint{0,0};
HHOOK g_hMouseHook = NULL;

LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam);
DWORD WINAPI MouseHookThread(LPVOID lpParam);
void PerformCapture();
void SimulateCtrlC();
std::wstring GetClipboardText();

// Overlay definitions
struct OverlayState {
    std::wstring question;
    HWND hWnd;
    HWND hQuestion;
    HWND hOpt1;
    HWND hOpt2;
    HWND hStatus;
};

LRESULT CALLBACK OverlayWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
void ShowOverlayWindow(const std::wstring &text);
bool SubmitPoll(const std::wstring &q, const std::vector<std::wstring> &opts, std::wstring &outUrl);

DWORD WINAPI MouseHookThread(LPVOID lpParam)
{
    g_hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, LowLevelMouseProc, NULL, 0);
    MSG msg;
    while(GetMessage(&msg, NULL, 0,0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    UnhookWindowsHookEx(g_hMouseHook);
    return 0;
}

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int)
{
    std::setlocale(LC_ALL, "");
    HANDLE hThread = CreateThread(NULL,0,MouseHookThread,NULL,0,NULL);
    MSG msg;
    while(GetMessage(&msg,NULL,0,0)) {
        if(msg.message==WM_QUIT) break;
    }
    PostThreadMessage(GetThreadId(hThread), WM_QUIT,0,0);
    WaitForSingleObject(hThread,INFINITE);
    return 0;
}

LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam)
{
    if(nCode == HC_ACTION) {
        auto *p = reinterpret_cast<PMSLLHOOKSTRUCT>(lParam);
        if(p) {
            if(wParam==WM_LBUTTONDOWN) {
                g_isDragging=true;
                g_startPoint=p->pt;
            } else if(wParam==WM_LBUTTONUP && g_isDragging) {
                g_isDragging=false;
                g_endPoint=p->pt;
                RECT rect{std::min(g_startPoint.x,g_endPoint.x), std::min(g_startPoint.y,g_endPoint.y),
                           std::max(g_startPoint.x,g_endPoint.x), std::max(g_startPoint.y,g_endPoint.y)};
                if(rect.right-rect.left>0 && rect.bottom-rect.top>0) {
                    PerformCapture();
                }
            }
        }
    }
    return CallNextHookEx(g_hMouseHook,nCode,wParam,lParam);
}

void PerformCapture()
{
    HWND hConsole = GetConsoleWindow();
    ShowWindow(hConsole, SW_HIDE);
    POINT center{(g_startPoint.x+g_endPoint.x)/2,(g_startPoint.y+g_endPoint.y)/2};
    HWND hTarget = WindowFromPoint(center);
    if(hTarget && hTarget!=hConsole) {
        SetForegroundWindow(hTarget);
        Sleep(50);
    }
    if(OpenClipboard(NULL)) { EmptyClipboard(); CloseClipboard(); }
    SimulateCtrlC();
    Sleep(50);
    std::wstring captured = GetClipboardText();
    ShowWindow(hConsole, SW_SHOW);
    if(captured.empty()) return;
    ShowOverlayWindow(captured);
}

void ShowOverlayWindow(const std::wstring &text)
{
    static bool registered=false;
    if(!registered){
        WNDCLASS wc{};
        wc.lpfnWndProc=OverlayWndProc;
        wc.hInstance=GetModuleHandle(NULL);
        wc.lpszClassName=L"OverlayPoller";
        wc.hbrBackground=(HBRUSH)(COLOR_WINDOW+1);
        RegisterClass(&wc);
        registered=true;
    }
    OverlayState *state = new OverlayState();
    state->question=text;
    int width=300, height=200;
    HWND hwnd = CreateWindowEx(WS_EX_TOPMOST|WS_EX_TOOLWINDOW,L"OverlayPoller",L"Create Poll",
        WS_POPUP|WS_BORDER, g_endPoint.x, g_endPoint.y, width, height,
        NULL,NULL,GetModuleHandle(NULL), state);
    ShowWindow(hwnd, SW_SHOW);
    UpdateWindow(hwnd);
}

LRESULT CALLBACK OverlayWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    OverlayState *state = reinterpret_cast<OverlayState*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
    switch(msg)
    {
    case WM_CREATE:
        state = reinterpret_cast<OverlayState*>(((LPCREATESTRUCT)lParam)->lpCreateParams);
        SetWindowLongPtr(hwnd, GWLP_USERDATA, (LONG_PTR)state);
        state->hWnd=hwnd;
        state->hQuestion = CreateWindowEx(0,L"EDIT", state->question.c_str(), WS_CHILD|WS_VISIBLE|WS_BORDER|ES_AUTOHSCROLL,
                                10,10,260,20, hwnd,NULL,GetModuleHandle(NULL),NULL);
        CreateWindowW(L"STATIC", L"Option 1", WS_CHILD|WS_VISIBLE, 10,40,60,20, hwnd,NULL,GetModuleHandle(NULL),NULL);
        state->hOpt1 = CreateWindowEx(0,L"EDIT", L"", WS_CHILD|WS_VISIBLE|WS_BORDER|ES_AUTOHSCROLL,
                                80,40,190,20, hwnd,NULL,GetModuleHandle(NULL),NULL);
        CreateWindowW(L"STATIC", L"Option 2", WS_CHILD|WS_VISIBLE, 10,70,60,20, hwnd,NULL,GetModuleHandle(NULL),NULL);
        state->hOpt2 = CreateWindowEx(0,L"EDIT", L"", WS_CHILD|WS_VISIBLE|WS_BORDER|ES_AUTOHSCROLL,
                                80,70,190,20, hwnd,NULL,GetModuleHandle(NULL),NULL);
        CreateWindowW(L"BUTTON", L"Submit", WS_CHILD|WS_VISIBLE, 10,100,80,24, hwnd,(HMENU)1,GetModuleHandle(NULL),NULL);
        state->hStatus = CreateWindowW(L"STATIC", L"", WS_CHILD|WS_VISIBLE, 10,130,260,40, hwnd,NULL,GetModuleHandle(NULL),NULL);
        break;
    case WM_COMMAND:
        if(LOWORD(wParam)==1) {
            wchar_t qbuf[256], o1[128], o2[128];
            GetWindowTextW(state->hQuestion,qbuf,256);
            GetWindowTextW(state->hOpt1,o1,128);
            GetWindowTextW(state->hOpt2,o2,128);
            std::vector<std::wstring> opts;
            if(wcslen(o1)) opts.push_back(o1);
            if(wcslen(o2)) opts.push_back(o2);
            if(wcslen(qbuf) && opts.size()>1) {
                std::wstring url;
                if(SubmitPoll(qbuf, opts, url)) {
                    std::wstring msg=L"Success: "+url;
                    SetWindowTextW(state->hStatus,msg.c_str());
                } else {
                    SetWindowTextW(state->hStatus,L"Failed to create poll");
                }
            } else {
                SetWindowTextW(state->hStatus,L"Enter question and two options");
            }
        }
        break;
    case WM_DESTROY:
        delete state;
        break;
    }
    return DefWindowProc(hwnd,msg,wParam,lParam);
}


bool SubmitPoll(const std::wstring &q, const std::vector<std::wstring> &opts, std::wstring &outUrl)
{
    HINTERNET hSession = WinHttpOpen(L"OverlayPoller", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if(!hSession) return false;
    HINTERNET hConnect = WinHttpConnect(hSession, L"localhost", 3000, 0);
    if(!hConnect){ WinHttpCloseHandle(hSession); return false; }
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", L"/api/polls", NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, 0);
    if(!hRequest){ WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false; }
    std::wstring json=L"{\"taskDescription\":\""+q+L"\",\"options\":[";
    for(size_t i=0;i<opts.size();++i){
        if(i) json+=L",";
        json+=L"\""+opts[i]+L"\"";
    }
    json+=L"]}";
    std::string utf8;
    int size=WideCharToMultiByte(CP_UTF8,0,json.c_str(),-1,NULL,0,NULL,NULL);
    utf8.resize(size-1);
    WideCharToMultiByte(CP_UTF8,0,json.c_str(),-1,utf8.data(),size,NULL,NULL);
    BOOL b = WinHttpSendRequest(hRequest, L"Content-Type: application/json\r\n", -1, (LPVOID)utf8.data(), utf8.size(), utf8.size(), 0);
    if(!b){ WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return false; }
    WinHttpReceiveResponse(hRequest, NULL);
    DWORD dwSize=0; WinHttpQueryDataAvailable(hRequest,&dwSize);
    std::string resp(dwSize,0); DWORD read=0; WinHttpReadData(hRequest,&resp[0],dwSize,&read);
    WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession);
    size_t pos = resp.find("pollUrl\":");
    if(pos!=std::string::npos){
        pos=resp.find('"',pos+9);
        if(pos!=std::string::npos){
            size_t end=resp.find('"',pos+1);
            if(end!=std::string::npos){
                std::string url=resp.substr(pos+1,end-pos-1);
                int wsize=MultiByteToWideChar(CP_UTF8,0,url.c_str(),-1,NULL,0);
                std::wstring wurl(wsize-1,0);
                MultiByteToWideChar(CP_UTF8,0,url.c_str(),-1,&wurl[0],wsize);
                outUrl=wurl; return true;
            }
        }
    }
    return false;
}

void SimulateCtrlC()
{
    INPUT inputs[4] = {};
    inputs[0].type = INPUT_KEYBOARD; inputs[0].ki.wVk = VK_CONTROL;
    inputs[1].type = INPUT_KEYBOARD; inputs[1].ki.wVk = 'C';
    inputs[2].type = INPUT_KEYBOARD; inputs[2].ki.wVk = 'C'; inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[3].type = INPUT_KEYBOARD; inputs[3].ki.wVk = VK_CONTROL; inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(4, inputs, sizeof(INPUT));
}

std::wstring GetClipboardText()
{
    std::wstring text;
    if(!IsClipboardFormatAvailable(CF_UNICODETEXT)) return text;
    if(!OpenClipboard(NULL)) return text;
    HGLOBAL hData = GetClipboardData(CF_UNICODETEXT);
    if(hData){
        LPCWSTR pszText = static_cast<LPCWSTR>(GlobalLock(hData));
        if(pszText){ text = pszText; GlobalUnlock(hData); }
    }
    CloseClipboard();
    return text;
}

