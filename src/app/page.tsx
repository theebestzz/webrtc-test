"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [offer, setOffer] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    async function getMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.log("Error accessing media devices:", error);
      }
    }
    getMedia();
  }, []);

  const startConnection = async () => {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    const pc = new RTCPeerConnection(configuration);
    setPeerConnection(pc);

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate:", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    setOffer(JSON.stringify(offer));
    console.log("Offer created:", offer);
  };

  const handleOffer = async () => {
    if (!offer) {
      console.error("Offer is empty");
      return;
    }

    try {
      const offerDesc = new RTCSessionDescription(JSON.parse(offer));
      await peerConnection?.setRemoteDescription(offerDesc);

      const answer = await peerConnection?.createAnswer();
      await peerConnection?.setLocalDescription(answer);
      setAnswer(JSON.stringify(answer));
      console.log("Answer created:", answer);
    } catch (error) {
      console.error("Error parsing offer:", error);
    }
  };

  const handleAnswer = async () => {
    if (!answer) {
      console.error("Answer is empty");
      return;
    }

    try {
      const answerDesc = new RTCSessionDescription(JSON.parse(answer));
      await peerConnection?.setRemoteDescription(answerDesc);
      console.log("Answer set as remote description");
    } catch (error) {
      console.error("Error parsing answer:", error);
    }
  };

  return (
    <div className="flex flex-col">
      <h1>WebRTC Test</h1>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted />
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
      <button onClick={startConnection}>Create Offer</button>
      <textarea
        placeholder="Copy the offer here to connect as Peer B"
        value={offer || ""}
        onChange={(e) => setOffer(e.target.value)}
      />
      <button onClick={handleOffer}>Set Offer</button>
      <textarea
        placeholder="Copy the answer here to connect as Peer A"
        value={answer || ""}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button onClick={handleAnswer}>Set Answer</button>
    </div>
  );
}
