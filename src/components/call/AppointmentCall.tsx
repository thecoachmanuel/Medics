import { Appointment } from "@/store/appointmentStore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

interface AppointmentCallInterface {
  appointment: Appointment;
  currentUser: {
    id: string;
    name: string;
    role: "doctor" | "patient";
  };
  onCallEnd: () => void;
  joinConsultation: (appointmentId: string) => Promise<void>;
}
const AppointmentCall = ({
  appointment,
  currentUser,
  onCallEnd,
  joinConsultation,
}: AppointmentCallInterface) => {
  const zpRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef(false);
  const isComponentMountedRef = useRef(true);

  const [callError, setCallError] = useState<string | null>(null);

  const memoizedJoinConsultation = useCallback(
    async (appointmentId: string) => {
      await joinConsultation(appointmentId);
    },
    [joinConsultation]
  );

  

  const intializeCall = useCallback(
    async (container: HTMLDivElement) => {
      if (
        initializationRef.current ||
        zpRef.current ||
        !isComponentMountedRef.current
      ) {
        return;
      }

      if (!container || !container.isConnected) {
        return;
      }

      try {
        initializationRef.current = true;
        const appId = process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID;
        const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET;

        if (!appId || !serverSecret) {
          throw new Error("Zegocloud credentials not configured");
        }

        const numericAppId = Number.parseInt(appId);

        if (isNaN(numericAppId)) {
          throw new Error("Invalid Zegocloud App Id");
        }

        try {
          await memoizedJoinConsultation(appointment?._id);
        } catch (error) {
          console.warn("failed to update appointment", error);
        }

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          numericAppId,
          serverSecret,
          appointment.zegoRoomId,
          currentUser.id,
          currentUser.name
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        const isVideoCall =
          appointment.consultationType === "Video Consultation";

        zp.joinRoom({
          container,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          turnOnMicrophoneWhenJoining: true,
          showMyMicrophoneToggleButton: true,
          turnOnCameraWhenJoining: isVideoCall,
          showMyCameraToggleButton: isVideoCall,
          showScreenSharingButton: true,
          showTextChat: true,
          showUserList: true,
          showRemoveUserButton: true,
          showPinButton: false,
          showAudioVideoSettingsButton: true,
          showTurnOffRemoteCameraButton: true,
          showTurnOffRemoteMicrophoneButton: true,
          maxUsers: 2,
          layout: "Auto",
          showLayoutButton: false,
          onJoinRoom: () => {
            if (isComponentMountedRef.current) {
              console.log(
                `Joined ${appointment.consultationType} : ${appointment.zegoRoomId}`
              );
            }
          },
          onLeaveRoom: () => {
            if (isComponentMountedRef.current) {
              if (zpRef.current) {
                try {
                  zpRef.current.mutePublishStreamAudio(true);
                  zpRef.current.mutePublishStreamVideo(true);
                } catch (error) {
                  console.warn("Error turning off camera/mircophone");
                }
              }
            }
          },
          onUserJoin: (users: any[]) => {
            if (isComponentMountedRef.current) {
              console.log("Users Joined", users);
            }
          },
          onUserLeave: (users: any[]) => {
            if (isComponentMountedRef.current) {
              console.log("Users left", users);
            }
          },

          showLeavingView: true,

          onReturnToHomeScreenClicked: () => {
            if (zpRef.current) {
              try {
                zpRef.current.mutePublishStreamAudio(true);
                zpRef.current.mutePublishStreamVideo(true);
              } catch (error) {
                console.warn("Error turning off camera/mircophone");
              }
            }
            onCallEnd();
          },
        });
      } catch (error: any) {
        console.error("Call Initilization failed", error);
        initializationRef.current = false;
        if (isComponentMountedRef.current) {
          zpRef.current = null;
          setCallError(error.message || "Failed to initialize call");
        }
      }
    },
    [
      appointment?._id,
      appointment.zegoRoomId,
      appointment.consultationType,
      currentUser.id,
      currentUser.name,
      memoizedJoinConsultation,
      onCallEnd,
    ]
  );

  useEffect(() => {
    if (
      containerRef.current &&
      !initializationRef.current &&
      currentUser.id &&
      currentUser.name &&
      isComponentMountedRef.current
    ) {
      intializeCall(containerRef.current);
    }
    return () => {
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (error) {
          console.warn("Error during cleaup", error);
        } finally {
          zpRef.current = null;
        }
      }
    };
  }, [currentUser.id, currentUser.name, intializeCall]);

  const isVideoCall = appointment.consultationType === "Video Consultation";

  if (callError) {
    return (
      <div className="h-screen w-full bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Call Error</h2>
          <p className="text-gray-600 mb-6">{callError}</p>
          <button
            onClick={onCallEnd}
            className="w-full bg-gray-900 text-white font-medium py-2 px-4 rounded hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {isVideoCall ? "Video Consultation" : "Voice Consultation"}
          </h1>

          <p className="text-sm text-gray-600">
            {currentUser.role === "doctor"
              ? `Patient: ${appointment.patientId.name}`
              : `Dr: ${appointment.doctorId.name}`}
          </p>
        </div>
      </div>
      <div className="flex-1">
        <div
          ref={containerRef}
          id="appointment-call-container"
          className="w-full h-full bg-gray-900"
          style={{ height: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default AppointmentCall;
