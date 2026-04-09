import SwiftUI
import AVFoundation

struct ContentView: View {
    @StateObject private var camera = CameraController()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            switch camera.authorizationStatus {
            case .authorized:
                CameraView(controller: camera)
                    .ignoresSafeArea()

            case .notDetermined:
                ProgressView()
                    .tint(.white)
                    .onAppear { camera.requestAccess() }

            case .denied, .restricted:
                VStack(spacing: 16) {
                    Text("카메라 권한이 필요합니다")
                        .foregroundStyle(.white)
                        .font(.headline)
                    Text("설정 → MirrorMe에서 카메라 접근을 허용해 주세요.")
                        .foregroundStyle(.white.opacity(0.7))
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                    Button("설정 열기") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()

            @unknown default:
                EmptyView()
            }
        }
        .onAppear { camera.start() }
        .onDisappear { camera.stop() }
    }
}
