import AVFoundation
import SwiftUI

/// 전면 카메라 세션을 관리한다.
/// 핵심: 프리뷰의 좌우 미러링을 끄고 "상대방이 보는 나"로 표시한다.
final class CameraController: ObservableObject {
    @Published var authorizationStatus: AVAuthorizationStatus =
        AVCaptureDevice.authorizationStatus(for: .video)

    let session = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "mirrorme.session")
    private var isConfigured = false

    func requestAccess() {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                self?.authorizationStatus = granted ? .authorized : .denied
                if granted { self?.start() }
            }
        }
    }

    func start() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            if !self.isConfigured { self.configure() }
            if !self.session.isRunning { self.session.startRunning() }
        }
    }

    func stop() {
        sessionQueue.async { [weak self] in
            guard let self else { return }
            if self.session.isRunning { self.session.stopRunning() }
        }
    }

    private func configure() {
        session.beginConfiguration()
        session.sessionPreset = .high

        guard
            let device = AVCaptureDevice.default(
                .builtInWideAngleCamera,
                for: .video,
                position: .front
            ),
            let input = try? AVCaptureDeviceInput(device: device),
            session.canAddInput(input)
        else {
            session.commitConfiguration()
            return
        }

        session.addInput(input)
        session.commitConfiguration()
        isConfigured = true
    }
}
