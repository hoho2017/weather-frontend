"use client";
import React, { useState, useEffect, useRef } from "react";

function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  function extractTime(url: string) {
    const match = url.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
    return match ? match[1] : "";
  }
  const imageTimes = images.map(extractTime);

  useEffect(() => {
    if (images.length === 0 || dragging) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images, dragging]);

  const onDragStart = (e: React.MouseEvent) => {
    setDragging(true);
    document.body.style.userSelect = "none";
  };
  const onDrag = (e: React.MouseEvent) => {
    if (!dragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = x / rect.width;
    const idx = Math.round(percent * (images.length - 1));
    setCurrent(idx);
  };
  const onDragEnd = () => {
    setDragging(false);
    document.body.style.userSelect = "";
  };
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => onDrag(e as any);
    const up = () => onDragEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging]);

  if (!images.length) return <div className="h-64 flex items-center justify-center text-gray-400">暂无图片</div>;

  const percent = images.length === 1 ? 0 : current / (images.length - 1);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg shadow-lg bg-white p-4">
      <div className="relative h-80 flex items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full shadow p-2 z-10"
          onClick={() => setCurrent((current - 1 + images.length) % images.length)}
        >
          <span className="text-2xl">⟨</span>
        </button>
        <img
          src={images[current]}
          className="h-full max-h-72 w-auto mx-auto object-contain transition-all duration-300 rounded-lg shadow"
          alt="carousel"
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full shadow p-2 z-10"
          onClick={() => setCurrent((current + 1) % images.length)}
        >
          <span className="text-2xl">⟩</span>
        </button>
      </div>
      <div className="w-full flex flex-col items-center mt-8">
        <div
          ref={timelineRef}
          className="relative w-full h-6 flex items-center"
          style={{ touchAction: "none" }}
        >
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-300 rounded" />
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `calc(${percent * 100}% - 20px)` }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white border-2 border-[#91caff] bg-transparent cursor-pointer transition-all duration-150 relative select-none"
              onMouseDown={onDragStart}
              style={{ transition: dragging ? "none" : "left 0.2s" }}
            >
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">{imageTimes[current]}</div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-2">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

export default function Home() {
  const [lat, setLat] = useState("31.23");
  const [lon, setLon] = useState("121.47");
  const [images, setImages] = useState<string[]>([]);

  const fetchImages = () => {
    setImages([]);
    const url = `/api/proxy?lat=${lat}&lon=${lon}`;
    const es = new EventSource(url);
    es.addEventListener("image", (event) => {
      const data = (event as MessageEvent).data;
      const src = `/api/image-proxy?path=${encodeURIComponent(data)}`;
      setImages(prev => [...prev, src]);
    });
    es.onerror = () => {
      es.close();
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-start py-8">
      <form
        className="mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center bg-white/90 rounded-xl shadow px-6 py-5 w-full max-w-xl"
        onSubmit={e => { e.preventDefault(); fetchImages(); }}
      >
        纬度:<input
          type="text"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="纬度"
          className="flex-1 min-w-0 border border-blue-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 placeholder:text-blue-300 transition"
        />
       经度:<input
          type="text"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="经度"
          className="flex-1 min-w-0 border border-blue-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 placeholder:text-blue-300 transition"
        />
        <button
          type="submit"
          className="w-full sm:w-auto bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold px-8 py-2 rounded-lg shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          获取图像
        </button>
      </form>
      <Carousel images={images} />
    </div>
  );
}
