import SwiftUI

struct ContentView: View {
    @State private var prompt = ""
    @State private var response = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                ScrollView {
                    Text(response.isEmpty ? "J.A.R.V.I.S ready." : response)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                }
                HStack {
                    TextField("Ask J.A.R.V.I.S…", text: $prompt)
                        .textFieldStyle(.roundedBorder)
                    Button("Send") {
                        response = prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "Please enter a request." : "Request queued: \(prompt)"
                        prompt = ""
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            .padding()
            .navigationTitle("J.A.R.V.I.S")
        }
    }
}

#Preview {
    ContentView()
}
