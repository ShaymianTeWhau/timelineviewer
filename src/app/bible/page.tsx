"use client";

import "./style.css"
import Head from "next/head";
import Script from "next/script";

export default function TimelinePage() {
  return (
    <>
      <Head>
        <title>Timeline Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/timeline-viewer.png" />
        <link rel="stylesheet" href="/style.css" />
      </Head>
      <canvas id="timeline-canvas" data-timeline-id="timeline-bible.json"></canvas>
      <div id="info-panel">Select Time Period</div>
      <div id="zoom-controls">
        <button id="zoom-in">+</button>
        <button id="zoom-out">−</button>
      </div>
      <div id="lane-panel"></div>
      <div id="instruction-panel-container"></div>

      <Script src="/timelineViewer.js" strategy="afterInteractive" />
    </>
  );
}
