// src/pages/CollageViewerPage.tsx - Enhanced UI with glassmorphism and improved UX
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Upload, Edit, Maximize2, ChevronLeft, X, Camera } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { ErrorBoundary } from 'react-error-boundary';
import CollageScene from '../components/three/CollageScene';
import PhotoUploader from '../components/collage/PhotoUploader';

// Error fallback component for 3D scene errors
function SceneErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-red-900/30 backdrop-blur-sm rounded-lg border border-red-500/50 p-6 flex flex-col items-center justify-center h-[calc(100vh-200px)]">
      <h3 className="text-xl font-bold text-white mb-2">Something went wrong rendering the scene</h3>
      <p className="text-red-200 mb-4 text-center max-w-md">
        There was an error loading the 3D scene. This could be due to WebGL issues or resource limitations.
      </p>
      <pre className="bg-black/50 p-3 rounded text-red-300 text-xs max-w-full overflow-auto mb-4 max-h-32">
        {error.message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

const CollageViewerPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { 
    currentCollage, 
    photos, 
    fetchCollageByCode, 
    loading, 
    error, 
    isRealtimeConnected,
    refreshPhotos,
    cleanupRealtimeSubscription
  } = useCollageStore();
  
  // SAFETY: Ensure photos is always an array
  const safePhotos = Array.isArray(photos) ? photos : [];
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const navigate = useNavigate();

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setTimeout(() => setControlsVisible(false), 3000);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setControlsVisible(true);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea and uploader is not open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || showUploader) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (showUploader) {
            setShowUploader(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showUploader]);

  // Load collage and setup realtime subscription
  useEffect(() => {
    if (code) {
      fetchCollageByCode(code);
    }
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [code, fetchCollageByCode, cleanupRealtimeSubscription]);

  // Manual refresh for when realtime fails
  const handleManualRefresh = useCallback(async () => {
    if (currentCollage?.id) {
      await refreshPhotos(currentCollage.id);
    }
  }, [currentCollage?.id, refreshPhotos]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hide/show controls on mouse movement in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    let hideTimeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setControlsVisible(false), 4000);
    };

    const handleMouseLeave = () => {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => setControlsVisible(false), 1500);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(hideTimeout);
    };
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setControlsVisible(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading && !currentCollage) {
    return (
      <div className="min-h-screen bg-black">
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2 text-gray-400">Loading collage...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentCollage) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Collage Not Found</h2>
            <p className="text-gray-400 mb-6">
              The collage you're looking for doesn't exist or might have been removed.
            </p>
            <Link 
              to="/join" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            >
              Try Another Code
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Main Scene */}
      <div className="relative w-full h-screen">
        <ErrorBoundary 
          FallbackComponent={SceneErrorFallback}
          resetKeys={[currentCollage.id, safePhotos.length]}
        >
          <CollageScene 
            photos={safePhotos}
            settings={currentCollage.settings}
            onSettingsChange={(newSettings) => {
              console.log('Settings changed from viewer:', newSettings);
            }}
          />
        </ErrorBoundary>

        {/* Glassmorphic Header - Fixed to top */}
        <div 
          className={`fixed top-0 left-0 right-0 z-10 transition-all duration-500 ease-in-out ${
            controlsVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-full pointer-events-none'
          }`}
        >
          <div className="bg-black/10 backdrop-blur-2xl border-b border-white/5">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-xl font-bold text-white drop-shadow-sm">{currentCollage.name}</h1>
                    <div className="flex items-center space-x-2 text-white/70 text-sm">
                      <span>Code: {currentCollage.code}</span>
                      <span>•</span>
                      <span>{safePhotos.length} photos</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-400' : 'bg-yellow-400'} shadow-sm`}></div>
                        <span>{isRealtimeConnected ? 'Live' : 'Polling'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/photobooth/${currentCollage.code}`}
                    className="group px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white/90 hover:text-white rounded-xl transition-all duration-300 text-sm flex items-center space-x-2 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
                    title="Open Photobooth"
                  >
                    <Camera className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">Photobooth</span>
                  </Link>
                  
                  <button
                    onClick={() => setShowUploader(true)}
                    className="group px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white/90 hover:text-white rounded-xl transition-all duration-300 text-sm flex items-center space-x-2 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">Add Photos</span>
                  </button>
                  
                  <button
                    onClick={handleCopyLink}
                    className="group px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white/90 hover:text-white rounded-xl transition-all duration-300 text-sm flex items-center space-x-2 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
                  >
                    <Share2 className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">{copied ? 'Copied!' : 'Share'}</span>
                  </button>
                  
                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen (F)"
                    className="group p-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white/90 hover:text-white rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl"
                  >
                    <Maximize2 className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Uploader Modal - Improved */}
        {showUploader && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header - Sticky */}
              <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Photos to {currentCollage.name}</h2>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  title="Close (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Content - Scrollable */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <PhotoUploader
                  collageId={currentCollage.id}
                  onUploadComplete={() => {
                    // Photos will appear automatically via realtime
                    // Optional: Show a toast notification or keep modal open
                  }}
                />
              </div>
              
              {/* Modal Footer - Sticky */}
              <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-md border-t border-white/10 px-6 py-4">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Press ESC to close</span>
                  <button
                    onClick={() => setShowUploader(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen hint */}
        {isFullscreen && controlsVisible && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-black/50 backdrop-blur-md rounded-lg px-4 py-2 text-white text-sm border border-white/20">
              Controls auto-hide • Move mouse to show • Press F for fullscreen
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint - Non-fullscreen */}
        {!isFullscreen && (
          <div className="fixed bottom-4 right-4 z-10">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 text-white/70 text-xs border border-white/10">
              Press F for fullscreen
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollageViewerPage;