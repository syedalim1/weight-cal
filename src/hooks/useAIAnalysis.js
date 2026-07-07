"use client";
import { useState, useCallback, useRef } from "react";

const DEFAULT_DIMENSIONS = {
  overallHeight: "",
  overallWidth: "",
  overallDepth: "",
  mainPipeSize: "1.0",
  sidePipeSize: "0.75",
  legPipeSize: "1.0",
  seatSupportPipeSize: "0.75",
  backSupportPipeSize: "0.75",
  materialType: "ms",
  pipeShape: "square",
  pipeThickness: "1.5",
};

export function useAIAnalysis() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [dimensions, setDimensions] = useState({ ...DEFAULT_DIMENSIONS });
  const [isManualMode, setIsManualMode] = useState(false);
  const [msSteelRate, setMsSteelRate] = useState(120);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [cutList, setCutList] = useState([]);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const pollIntervalRef = useRef(null);

  const resizeImage = useCallback((file, maxDim = 1024) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB.");
      return;
    }
    try {
      setError(null);
      const resized = await resizeImage(file);
      setImage(resized);
      setImageFile(file.name);
      setCurrentStep(2);
    } catch (err) {
      setError("Failed to process image. Please try another file.");
      console.error("Image processing error:", err);
    }
  }, [resizeImage]);

  const removeImage = useCallback(() => {
    setImage(null);
    setImageFile(null);
    setCurrentStep(1);
    setAnalysisResult(null);
    setCutList([]);
    setError(null);
  }, []);

  const updateDimension = useCallback((field, value) => {
    setDimensions((prev) => ({ ...prev, [field]: value }));
  }, []);

  const pollJobStatus = useCallback(async (jobId) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) return;

      const { job } = await res.json();
      
      if (job) {
        if (job.progress) {
          setProgressMessage(job.progress);
        }

        if (job.status === "completed") {
          clearInterval(pollIntervalRef.current);
          const data = job.result;
          setAnalysisResult({
            furnitureType: data.furnitureType,
            analysis: data.analysis,
            structuralMembers: data.structuralMembers || [],
            rawResponse: data.rawResponse,
            usage: data.usage,
          });

          if (data.cutList && data.cutList.length > 0) {
            setCutList(data.cutList);
            setCurrentStep(4);
          } else if (data.parseError) {
            setError("AI returned a response but it couldn't be parsed into a cut list. Try re-analyzing.");
            setCurrentStep(3);
          } else {
            setError("AI did not identify any structural members. Try a clearer image or provide more dimensions.");
            setCurrentStep(3);
          }
          setIsAnalyzing(false);
        } else if (job.status === "failed") {
          clearInterval(pollIntervalRef.current);
          setError(job.error || "Analysis failed during background processing.");
          setCurrentStep(3);
          setIsAnalyzing(false);
        }
      }
    } catch (err) {
      console.error("Error polling job status:", err);
    }
  }, []);

  const analyzeImage = useCallback(async () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setCutList([]);
    setCurrentStep(3);
    setProgressMessage("Initiating analysis job...");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          dimensions: isManualMode ? dimensions : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to start analysis");
      }

      if (data.jobId) {
        // Start polling for updates
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(data.jobId);
        }, 2000);
      } else {
        throw new Error("Did not receive a job ID");
      }

    } catch (err) {
      setError(err.message || "Failed to start analysis. Please try again.");
      setCurrentStep(2);
      setIsAnalyzing(false);
      console.error("Analysis error:", err);
    }
  }, [image, dimensions, isManualMode, pollJobStatus]);

  const resetAnalysis = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setImage(null);
    setImageFile(null);
    setDimensions({ ...DEFAULT_DIMENSIONS });
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setCutList([]);
    setError(null);
    setCurrentStep(1);
    setProgressMessage("");
  }, []);

  const goToResults = useCallback(() => {
    if (cutList.length > 0) {
      setCurrentStep(5);
    }
  }, [cutList]);

  return {
    image,
    imageFile,
    dimensions,
    isAnalyzing,
    progressMessage,
    analysisResult,
    cutList,
    setCutList,
    error,
    currentStep,
    setCurrentStep,
    isManualMode,
    setIsManualMode,
    msSteelRate,
    setMsSteelRate,

    handleImageUpload,
    removeImage,
    updateDimension,
    setDimensions,
    analyzeImage,
    resetAnalysis,
    goToResults,
  };
}
