import SwiftUI
import AVFoundation
import UIKit

/// AVCaptureVideoPreviewLayer를 SwiftUI에 연결하는 래퍼.
/// 여기서 `isVideoMirrored = false`로 설정하여
/// iOS 기본 셀카 프리뷰의 좌우 반전(거울 효과)을 해제한다.
struct CameraView: UIViewRepresentable {
    let controller: CameraController

    func makeUIView(context: Context) -> PreviewUIView {
        let view = PreviewUIView()
        view.backgroundColor = .black
        view.videoPreviewLayer.session = controller.session
        view.videoPreviewLayer.videoGravity = .resizeAspectFill

        if let connection = view.videoPreviewLayer.connection {
            if connection.isVideoMirroringSupported {
                connection.automaticallyAdjustsVideoMirroring = false
                connection.isVideoMirrored = false   // ← "상대방이 보는 나"
            }
            if connection.isVideoOrientationSupported {
                connection.videoOrientation = .portrait
            }
        }
        return view
    }

    func updateUIView(_ uiView: PreviewUIView, context: Context) {}
}

/// layerClass를 AVCaptureVideoPreviewLayer로 갖는 UIView.
final class PreviewUIView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var videoPreviewLayer: AVCaptureVideoPreviewLayer {
        layer as! AVCaptureVideoPreviewLayer
    }
}
