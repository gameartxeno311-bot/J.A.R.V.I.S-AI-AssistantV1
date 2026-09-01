import SwiftUI
import AVFoundation
import MapKit
import UniformTypeIdentifiers
import UIKit

struct ContentView: View {
    @StateObject private var jarvis = JARVISController()
    @State private var prompt = ""
    @State private var selectedSection = "Home"
    @State private var activeSheet: SheetType?
    @State private var notifications = [
        "System Update — All systems updated successfully.",
        "Backup Complete — Memory backup completed.",
        "Security Scan — No threats detected.",
        "New Log Entries — 24 new system logs."
    ]
    @State private var noteText = ""
    @State private var fileImporterOpen = false
    @State private var cameraOpen = false
    @State private var showDiagnostics = false
    @State private var showTerminal = false
    @State private var autoSpeak = true
    @State private var secureMode = true

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            HUDBackground()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 12) {
                    header
                    statusBar

                    HStack(alignment: .top, spacing: 10) {
                        sidebar
                        mainColumn
                        rightColumn
                    }

                    actionRow
                    conversation
                    footer
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
            }
        }
        .preferredColorScheme(.dark)
        .tint(.red)
        .sheet(item: $activeSheet) { sheet in
            SheetView(type: sheet, jarvis: jarvis, noteText: $noteText, secureMode: $secureMode)
        }
        .sheet(isPresented: $cameraOpen) { CameraView() }
        .fileImporter(isPresented: $fileImporterOpen, allowedContentTypes: [.item], allowsMultipleSelection: true) { result in
            switch result {
            case .success(let urls):
                jarvis.addLog("Imported \(urls.count) file(s).")
            case .failure(let error):
                jarvis.addLog("File import failed: \(error.localizedDescription)")
            }
        }
        .alert("Diagnostics", isPresented: $showDiagnostics) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("Core systems: 100%\nNetwork: 100%\nSecurity: 99%\nAPI connector: operational")
        }
        .onAppear { jarvis.startMonitoring() }
    }

    private var header: some View {
        HStack(alignment: .center) {
            HStack(spacing: 10) {
                HUDIcon(systemName: "scope", size: 46)
                VStack(alignment: .leading, spacing: 0) {
                    Text("J.A.R.V.I.S.").font(.system(size: 25, weight: .bold, design: .rounded)).foregroundStyle(.red)
                    Text("v7.2.1 • iOS").font(.caption).foregroundStyle(.gray)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 0) {
                Text(jarvis.timeString).font(.system(size: 25, weight: .medium, design: .monospaced)).foregroundStyle(.red)
                Text(jarvis.dateString).font(.caption).foregroundStyle(.gray)
            }
            Button { activeSheet = .settings } label: {
                Image(systemName: "gearshape").font(.title2).foregroundStyle(.red)
            }.buttonStyle(.plain).padding(.leading, 8)
        }
        .padding(.horizontal, 6)
    }

    private var statusBar: some View {
        HStack(spacing: 0) {
            StatusCell(title: "SYSTEM ONLINE", value: "All Systems Operational", icon: "circle.fill")
            StatusCell(title: "CORE TEMP", value: "\(jarvis.coreTemp)°C", icon: "waveform.path.ecg")
            StatusCell(title: "CPU USAGE", value: "\(jarvis.cpu)%", icon: "cpu")
            StatusCell(title: "MEMORY", value: "\(jarvis.memory)%", icon: "memorychip")
            StatusCell(title: "NETWORK", value: secureMode ? "Secure" : "Open", icon: "wifi")
        }
        .hudCard()
    }

    private var sidebar: some View {
        VStack(spacing: 4) {
            ForEach(["Home", "Conversation", "Memory", "Analytics", "Processes", "Tools", "Settings"], id: \.self) { item in
                Button {
                    selectedSection = item
                    if item == "Settings" { activeSheet = .settings }
                    else if item != "Home" { activeSheet = .section(item) }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: icon(for: item)).frame(width: 22)
                        Text(item).font(.system(size: 13, weight: .medium))
                        Spacer()
                    }
                    .foregroundStyle(selectedSection == item ? .white : .gray)
                    .padding(9)
                    .background(selectedSection == item ? Color.red.opacity(0.22) : .clear, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(selectedSection == item ? RoundedRectangle(cornerRadius: 10).stroke(.red.opacity(0.7), lineWidth: 1) : nil)
                }
                .buttonStyle(.plain)
            }
            Spacer(minLength: 10)
            Button { activeSheet = .profile } label: {
                HStack(spacing: 8) {
                    Circle().fill(.red.opacity(0.18)).frame(width: 34, height: 34).overlay(Image(systemName: "person.fill").foregroundStyle(.red))
                    VStack(alignment: .leading) { Text("Shadow").font(.caption).foregroundStyle(.white); Text("User Profile").font(.caption2).foregroundStyle(.gray) }
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding(8)
            }.buttonStyle(.plain)
        }
        .frame(width: 116)
        .hudCard()
    }

    private var mainColumn: some View {
        VStack(spacing: 10) {
            orbCard
            systemStatus
            activeProcesses
        }
        .frame(maxWidth: .infinity)
    }

    private var orbCard: some View {
        VStack(spacing: 8) {
            AnimatedOrb(isSpeaking: jarvis.isSpeaking, level: jarvis.audioLevel)
                .frame(height: 220)
            Text(jarvis.isSpeaking ? "J.A.R.V.I.S is speaking…" : "Good evening, Shadow.")
                .font(.system(size: 19, weight: .medium)).foregroundStyle(.white)
            Text(jarvis.isSpeaking ? "Voice output active" : "How can I assist you tonight?")
                .font(.subheadline).foregroundStyle(.gray)
            HStack(spacing: 10) {
                Button { jarvis.toggleListening() } label: {
                    Image(systemName: jarvis.isListening ? "waveform" : "mic.fill").font(.title2).frame(width: 48, height: 44)
                }.hudButton()
                VoiceWave(level: jarvis.audioLevel).frame(maxWidth: .infinity).frame(height: 40)
                Button { jarvis.stopSpeaking() } label: {
                    Image(systemName: "stop.fill").font(.title2).frame(width: 48, height: 44)
                }.hudButton()
            }
        }
        .hudCard()
    }

    private var systemStatus: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionTitle("SYSTEM STATUS")
            MeterRow("POWER", 100)
            MeterRow("CORE SYSTEMS", 100)
            MeterRow("SECURITY", 99)
            MeterRow("NETWORK", 100)
            Text("●  All systems nominal").font(.caption).foregroundStyle(.gray)
        }.hudCard()
    }

    private var activeProcesses: some View {
        VStack(alignment: .leading, spacing: 6) {
            SectionTitle("ACTIVE PROCESSES")
            ForEach(["Natural Language Engine", "Voice Synthesis Engine", "Memory Indexer", "Data Analyzer", "API Connector"], id: \.self) { process in
                HStack {
                    Image(systemName: "circle.fill").font(.system(size: 7)).foregroundStyle(.red)
                    Text(process).font(.caption).foregroundStyle(.white)
                    Spacer(); Text("Running").font(.caption2).foregroundStyle(.red)
                }.padding(.vertical, 3)
            }
            Button("View all processes") { activeSheet = .section("Processes") }.font(.caption).foregroundStyle(.red).buttonStyle(.plain)
        }.hudCard()
    }

    private var rightColumn: some View {
        VStack(spacing: 10) {
            notificationsCard
            coreCard
            quickAccess
        }.frame(width: 155)
    }

    private var notificationsCard: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack { SectionTitle("NOTIFICATIONS"); Spacer(); Button { notifications.removeAll() } label: { Image(systemName: "xmark") }.buttonStyle(.plain).foregroundStyle(.red) }
            ForEach(notifications.prefix(4), id: \.self) { notification in
                Text(notification).font(.caption2).foregroundStyle(.white).padding(7).frame(maxWidth: .infinity, alignment: .leading).background(Color.white.opacity(0.03), in: RoundedRectangle(cornerRadius: 8))
            }
            Button("View all notifications") { activeSheet = .notifications }.font(.caption2).foregroundStyle(.red).buttonStyle(.plain)
        }.hudCard()
    }

    private var coreCard: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack { SectionTitle("ASSISTANT CORE"); Spacer(); Image(systemName: "cpu").foregroundStyle(.red) }
            Text("J.A.R.V.I.S. Core").foregroundStyle(.white).font(.subheadline.bold())
            Text("v7.2.1").foregroundStyle(.gray).font(.caption)
            Divider().overlay(.red.opacity(0.2))
            KeyValue("Uptime", "7d 14h")
            KeyValue("Learning", "Continuous")
            KeyValue("Response", "0.02s")
            Button("Core Preferences") { activeSheet = .settings }.font(.caption).foregroundStyle(.red).buttonStyle(.plain)
        }.hudCard()
    }

    private var quickAccess: some View {
        VStack(alignment: .leading, spacing: 7) {
            SectionTitle("QUICK ACCESS")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 7) {
                QuickButton("Terminal", "terminal.fill") { showTerminal = true }
                QuickButton("Files", "folder.fill") { fileImporterOpen = true }
                QuickButton("Camera", "camera.fill") { cameraOpen = true }
                QuickButton("Drones", "antenna.radiowaves.left.and.right") { activeSheet = .section("Drones") }
                QuickButton("Maps", "map.fill") { activeSheet = .maps }
                QuickButton("Notes", "note.text") { activeSheet = .notes }
            }
        }.hudCard()
        .sheet(isPresented: $showTerminal) { TerminalView(jarvis: jarvis) }
    }

    private var actionRow: some View {
        HStack(spacing: 7) {
            QuickAction("Analyze Data", "chart.bar.xaxis") { jarvis.runAction("Data analysis complete.") }
            QuickAction("Access Memory", "brain.head.profile") { activeSheet = .section("Memory") }
            QuickAction("Run Diagnostics", "stethoscope") { showDiagnostics = true; jarvis.addLog("Diagnostics completed with no critical faults.") }
            QuickAction("Open Terminal", "terminal") { showTerminal = true }
        }
    }

    private var conversation: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionTitle("CONVERSATION")
            ScrollViewReader { proxy in
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 7) {
                        ForEach(jarvis.messages) { message in
                            HStack {
                                if message.fromJarvis { Image(systemName: "scope").foregroundStyle(.red) }
                                Text(message.text).font(.caption).foregroundStyle(.white).padding(9).background(message.fromJarvis ? Color.white.opacity(0.05) : Color.red.opacity(0.16), in: RoundedRectangle(cornerRadius: 10))
                                Spacer(minLength: 10)
                            }.id(message.id)
                        }
                    }
                }.frame(minHeight: 130, maxHeight: 210).onChange(of: jarvis.messages.count) { _ in if let last = jarvis.messages.last { proxy.scrollTo(last.id, anchor: .bottom) } }
            }
            HStack(spacing: 7) {
                TextField("Type your message…", text: $prompt, axis: .vertical).lineLimit(1...4).padding(9).background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 9)).foregroundStyle(.white)
                Button {
                    let text = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !text.isEmpty else { return }
                    prompt = ""
                    jarvis.send(text, speak: autoSpeak)
                } label: { Image(systemName: "paperplane.fill").font(.title3).frame(width: 44, height: 44) }.hudButton()
            }
            Toggle("Auto-Speak Responses", isOn: $autoSpeak).font(.caption).tint(.red)
        }.hudCard()
    }

    private var footer: some View {
        HStack(spacing: 0) {
            FooterCell("lock.fill", "CONNECTION STATUS", secureMode ? "Secure Connection Established" : "Unsecured") { secureMode.toggle() }
            FooterCell("network", "API STATUS", "All APIs Operational") { activeSheet = .section("API") }
            FooterCell("shield.fill", "DATA ENCRYPTION", "AES-256 Encrypted") { activeSheet = .section("Security") }
        }.hudCard()
    }

    private func icon(for item: String) -> String {
        switch item { case "Home": return "house.fill"; case "Conversation": return "bubble.left.and.bubble.right"; case "Memory": return "brain.head.profile"; case "Analytics": return "chart.bar.xaxis"; case "Processes": return "point.3.connected.trianglepath.dotted"; case "Tools": return "wrench.and.screwdriver"; default: return "gearshape" }
    }
}

private enum SheetType: Identifiable { case section(String), settings, notifications, profile, notes, maps; var id: String { switch self { case .section(let s): return s; case .settings: return "settings"; case .notifications: return "notifications"; case .profile: return "profile"; case .notes: return "notes"; case .maps: return "maps" } } }

private struct SheetView: View {
    let type: SheetType
    @ObservedObject var jarvis: JARVISController
    @Binding var noteText: String
    @Binding var secureMode: Bool
    var body: some View {
        NavigationStack {
            ZStack { Color.black.ignoresSafeArea(); HUDBackground(); content.padding() }
                .navigationTitle(title).navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .topBarTrailing) { Image(systemName: "scope").foregroundStyle(.red) } }
        }.preferredColorScheme(.dark).tint(.red)
    }
    private var title: String { switch type { case .section(let s): return s; case .settings: return "Settings"; case .notifications: return "Notifications"; case .profile: return "User Profile"; case .notes: return "Notes"; case .maps: return "Maps" } }
    @ViewBuilder private var content: some View {
        switch type {
        case .section(let section):
            VStack(alignment: .leading, spacing: 14) { Text(section == "API" ? "API CONNECTOR" : section.uppercased()).foregroundStyle(.red).font(.headline); Text("Module is operational and ready.").foregroundStyle(.white); ForEach(jarvis.logs, id: \.self) { Text("• \($0)").font(.caption).foregroundStyle(.gray) }; Spacer() }
        case .settings:
            Form { Section("Core") { Toggle("Secure Mode", isOn: $secureMode); HStack { Text("Voice") ; Spacer(); Text("J.A.R.V.I.S Voice").foregroundStyle(.gray) }; HStack { Text("Theme"); Spacer(); Text("Red HUD").foregroundStyle(.red) } } }.scrollContentBackground(.hidden).background(Color.clear)
        case .notifications:
            List(jarvis.notifications, id: \.self) { Text($0).foregroundStyle(.white).listRowBackground(Color.white.opacity(0.04)) }.scrollContentBackground(.hidden)
        case .profile:
            VStack(spacing: 12) { Image(systemName: "person.crop.circle.fill").font(.system(size: 80)).foregroundStyle(.red); Text("Shadow").font(.title.bold()).foregroundStyle(.white); Text("Primary User").foregroundStyle(.gray); Text("Authorization: VERIFIED").foregroundStyle(.red); Spacer() }
        case .notes:
            VStack { TextEditor(text: $noteText).scrollContentBackground(.hidden).background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 12)).foregroundStyle(.white); Button("Save Note") { jarvis.addLog("Note saved locally.") }.hudButton(); Spacer() }
        case .maps:
            Map(initialPosition: .region(MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: 38.8977, longitude: -77.0365), span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08))))
                .clipShape(RoundedRectangle(cornerRadius: 14)).overlay(RoundedRectangle(cornerRadius: 14).stroke(.red.opacity(0.6), lineWidth: 1))
        }
    }
}

private final class JARVISController: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published var isSpeaking = false
    @Published var isListening = false
    @Published var audioLevel = 0.25
    @Published var coreTemp = 42
    @Published var cpu = 23
    @Published var memory = 45
    @Published var messages: [ChatMessage] = [ChatMessage(fromJarvis: true, text: "J.A.R.V.I.S ready. Ask me anything.")]
    @Published var logs: [String] = ["Core initialized.", "Security scan passed.", "API connector operational."]
    let notifications = ["System Update — All systems updated successfully.", "Backup Complete — Memory backup completed.", "Security Scan — No threats detected.", "New Log Entries — 24 new system logs."]
    private let synthesizer = AVSpeechSynthesizer()
    private var timer: Timer?
    private var startDate = Date()
    private var observationTimer: Timer?

    var timeString: String { DateFormatter.time.string(from: Date()) }
    var dateString: String { DateFormatter.date.string(from: Date()) }
    override init() { super.init(); synthesizer.delegate = self }
    func startMonitoring() { observationTimer?.invalidate(); observationTimer = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { [weak self] _ in self?.tick() } }
    private func tick() { coreTemp = 40 + Int.random(in: 0...4); cpu = 18 + Int.random(in: 0...15); memory = 42 + Int.random(in: 0...8) }
    func send(_ text: String, speak: Bool) { messages.append(ChatMessage(fromJarvis: false, text: text)); let reply = response(for: text); messages.append(ChatMessage(fromJarvis: true, text: reply)); addLog("Processed request: \(text)"); if speak { speak(reply) } }
    func response(for text: String) -> String { let lower = text.lowercased(); if lower.contains("diagnostic") { return "Diagnostics complete. All critical systems are operational." }; if lower.contains("time") { return "The current system time is \(timeString)." }; if lower.contains("status") { return "Core temperature is \(coreTemp)°C. CPU is at \(cpu) percent. Network is secure." }; return "Request received. I have processed your instruction and am ready for the next command." }
    func speak(_ text: String) { stopSpeaking(); let utterance = AVSpeechUtterance(string: text); utterance.rate = 0.48; utterance.pitchMultiplier = 0.95; utterance.volume = 0.9; synthesizer.speak(utterance); isSpeaking = true; timer = Timer.scheduledTimer(withTimeInterval: 0.08, repeats: true) { [weak self] _ in self?.audioLevel = Double.random(in: 0.18...1.0) } }
    func stopSpeaking() { if synthesizer.isSpeaking { synthesizer.stopSpeaking(at: .immediate) }; timer?.invalidate(); timer = nil; isSpeaking = false; audioLevel = 0.25 }
    func toggleListening() { isListening.toggle(); addLog(isListening ? "Voice input listening." : "Voice input stopped."); if isListening { DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in self?.isListening = false } } }
    func runAction(_ text: String) { messages.append(ChatMessage(fromJarvis: true, text: text)); speak(text) }
    func addLog(_ text: String) { logs.insert(text, at: 0); if logs.count > 10 { logs.removeLast() } }
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) { DispatchQueue.main.async { self.isSpeaking = false; self.timer?.invalidate(); self.audioLevel = 0.25 } }
}

private struct ChatMessage: Identifiable { let id = UUID(); let fromJarvis: Bool; let text: String }

private struct HUDBackground: View { var body: some View { GeometryReader { geo in Canvas { context, size in for i in stride(from: 0, to: Int(size.height), by: 40) { var p = Path(); p.move(to: CGPoint(x: 0, y: CGFloat(i))); p.addLine(to: CGPoint(x: size.width, y: CGFloat(i))); context.stroke(p, with: .color(.red.opacity(0.025)), lineWidth: 1) } for x in stride(from: 0, to: size.width, by: 45) { var p = Path(); p.move(to: CGPoint(x: x, y: 0)); p.addLine(to: CGPoint(x: x, y: size.height)); context.stroke(p, with: .color(.red.opacity(0.02)), lineWidth: 1) } }.overlay(Rectangle().stroke(.red.opacity(0.5), lineWidth: 1).padding(5)) } } }

private struct AnimatedOrb: View { let isSpeaking: Bool; let level: Double; @State private var phase = 0.0; var body: some View { GeometryReader { geo in ZStack { ForEach(0..<7, id: \.self) { i in Circle().stroke(.red.opacity(isSpeaking ? 0.18 + Double(i) * 0.03 : 0.08), lineWidth: isSpeaking ? 2 : 1).frame(width: CGFloat(48 + i * 25) + (isSpeaking ? CGFloat(level * 14) : 0), height: CGFloat(48 + i * 25) + (isSpeaking ? CGFloat(level * 14) : 0)).rotationEffect(.degrees(phase + Double(i * 12))) } Circle().fill(.red.opacity(0.08)).frame(width: 92 + CGFloat(level * 24)).blur(radius: 14); Circle().fill(.red).frame(width: 38 + CGFloat(level * 12)).shadow(color: .red, radius: isSpeaking ? 22 : 12); Circle().fill(.white).frame(width: 13 + CGFloat(level * 5)) }.frame(maxWidth: .infinity, maxHeight: .infinity).onAppear { withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) { phase = 360 } }.animation(.easeInOut(duration: 0.12), value: level) } } }

private struct VoiceWave: View { let level: Double; var body: some View { Canvas { context, size in var path = Path(); let mid = size.height / 2; for x in stride(from: 0, through: size.width, by: 3) { let amp = CGFloat(level) * size.height * 0.38 * (0.3 + abs(sin(x * 0.08))); let y = mid + sin(x * 0.16) * amp; if x == 0 { path.move(to: CGPoint(x: x, y: y)) } else { path.addLine(to: CGPoint(x: x, y: y)) } }; context.stroke(path, with: .color(.red), lineWidth: 2) } } }

private struct StatusCell: View { let title: String; let value: String; let icon: String; var body: some View { VStack(alignment: .leading, spacing: 3) { HStack { Image(systemName: icon).foregroundStyle(.red).font(.caption); Text(title).font(.system(size: 8, weight: .bold)).foregroundStyle(.gray) }; Text(value).font(.system(size: 9)).foregroundStyle(.white).lineLimit(1) }.frame(maxWidth: .infinity, alignment: .leading).padding(7) } }
private struct SectionTitle: View { let text: String; init(_ text: String) { self.text = text }; var body: some View { Text(text).font(.system(size: 11, weight: .semibold)).foregroundStyle(.red) } }
private struct MeterRow: View { let name: String; let value: Int; init(_ name: String, _ value: Int) { self.name = name; self.value = value }; var body: some View { VStack(alignment: .leading, spacing: 3) { HStack { Text(name).font(.caption2).foregroundStyle(.gray); Spacer(); Text("\(value)%").font(.caption2).foregroundStyle(.white) }; GeometryReader { g in Capsule().fill(.white.opacity(0.06)).overlay(alignment: .leading) { Capsule().fill(.red).frame(width: g.size.width * CGFloat(value) / 100) } }.frame(height: 4) } } }
private struct KeyValue: View { let key: String; let value: String; init(_ key: String, _ value: String) { self.key = key; self.value = value }; var body: some View { HStack { Text(key).font(.caption2).foregroundStyle(.gray); Spacer(); Text(value).font(.caption2).foregroundStyle(.white) } } }
private struct HUDIcon: View { let systemName: String; let size: CGFloat; var body: some View { Circle().stroke(.red, lineWidth: 2).frame(width: size, height: size).overlay(Image(systemName: systemName).font(.system(size: size * 0.42)).foregroundStyle(.red)).shadow(color: .red.opacity(0.7), radius: 8) } }
private struct QuickButton: View { let title: String; let icon: String; let action: () -> Void; init(_ title: String, _ icon: String, action: @escaping () -> Void) { self.title = title; self.icon = icon; self.action = action }; var body: some View { Button(action: action) { VStack(spacing: 4) { Image(systemName: icon).font(.caption); Text(title).font(.system(size: 8)) }.foregroundStyle(.red).frame(maxWidth: .infinity).frame(height: 50).background(.white.opacity(0.03), in: RoundedRectangle(cornerRadius: 7)).overlay(RoundedRectangle(cornerRadius: 7).stroke(.red.opacity(0.25), lineWidth: 1)) }.buttonStyle(.plain) } }
private struct QuickAction: View { let title: String; let icon: String; let action: () -> Void; init(_ title: String, _ icon: String, action: @escaping () -> Void) { self.title = title; self.icon = icon; self.action = action }; var body: some View { Button(action: action) { Label(title, systemImage: icon).font(.system(size: 10, weight: .medium)).foregroundStyle(.white).frame(maxWidth: .infinity).padding(9).background(.white.opacity(0.03), in: RoundedRectangle(cornerRadius: 8)).overlay(RoundedRectangle(cornerRadius: 8).stroke(.red.opacity(0.25), lineWidth: 1)) }.buttonStyle(.plain) } }
private struct FooterCell: View { let icon: String; let title: String; let value: String; let action: () -> Void; init(_ icon: String, _ title: String, _ value: String, action: @escaping () -> Void) { self.icon = icon; self.title = title; self.value = value; self.action = action }; var body: some View { Button(action: action) { HStack(spacing: 7) { Image(systemName: icon).foregroundStyle(.red); VStack(alignment: .leading) { Text(title).font(.system(size: 7, weight: .bold)).foregroundStyle(.white); Text(value).font(.system(size: 7)).foregroundStyle(.gray).lineLimit(1) } }.frame(maxWidth: .infinity, alignment: .leading).padding(7) }.buttonStyle(.plain) } }

private extension View { func hudCard() -> some View { self.padding(9).background(Color.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 13)).overlay(RoundedRectangle(cornerRadius: 13).stroke(.red.opacity(0.28), lineWidth: 1)) }; func hudButton() -> some View { self.foregroundStyle(.red).background(.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 10)).overlay(RoundedRectangle(cornerRadius: 10).stroke(.red.opacity(0.55), lineWidth: 1)).buttonStyle(.plain) } }

private struct TerminalView: View { @ObservedObject var jarvis: JARVISController; @State private var command = ""; var body: some View { NavigationStack { VStack(alignment: .leading, spacing: 8) { ScrollView { VStack(alignment: .leading) { Text("J.A.R.V.I.S TERMINAL\nReady.").foregroundStyle(.red); ForEach(jarvis.logs, id: \.self) { Text("> \($0)").font(.caption).foregroundStyle(.green) } }.frame(maxWidth: .infinity, alignment: .leading) }; HStack { TextField("command", text: $command).textFieldStyle(.roundedBorder); Button("Run") { if !command.isEmpty { jarvis.addLog("Executed: \(command)"); command = "" } }.hudButton().padding(.horizontal, 8) } }.padding().background(Color.black).navigationTitle("Terminal") }.preferredColorScheme(.dark).tint(.red) } }

private struct CameraView: UIViewControllerRepresentable { func makeUIViewController(context: Context) -> UIImagePickerController { let picker = UIImagePickerController(); picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary; return picker }; func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {} }

private struct DateFormatter { static let time: Foundation.DateFormatter = { let f = Foundation.DateFormatter(); f.dateFormat = "h:mm:ss a"; return f }(); static let date: Foundation.DateFormatter = { let f = Foundation.DateFormatter(); f.dateFormat = "EEEE, MMM d, yyyy"; return f }() }

#Preview { ContentView() }
