// ==UserScript==
// @name         Recap Caption Extractor (Clipboard Only)
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Extracts captions from a Recap lecture page and copies them to the clipboard.
// @author       Wemmy0
// @match        *://recap.cloud.panopto.eu/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  "use strict";

  // --- Configuration ---
  const XPATH_TEMPLATE =
    "/html/body/form/div[3]/div[10]/div[9]/div/aside/div[2]/div[2]/div[7]/div[4]/ul/li[{index}]/div[2]/div[2]/span";
  // --- End Configuration ---

  function getElementByXpath(path, index) {
    const indexedPath = path.replace("{index}", index);
    return document.evaluate(
      indexedPath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }

  function extractCaptions() {
    console.log("Starting caption extraction...");
    const captions = [];
    let currentIndex = 1;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5; // Stop if we can't find 5 captions in a row

    while (true) {
      const captionElement = getElementByXpath(XPATH_TEMPLATE, currentIndex);

      if (captionElement && captionElement.textContent) {
        const text = captionElement.textContent.trim();
        if (text) {
          captions.push(text);
          console.log(`Extracted caption ${currentIndex}: ${text.substring(0,60)}...`);
        } else {
          console.log(`Caption ${currentIndex} found but is empty.`);
        }
        consecutiveFailures = 0; // Reset failure count on success
      } else {
        console.log(`Caption ${currentIndex} not found.`);
        consecutiveFailures++;
        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log(
            `Stopping after ${maxConsecutiveFailures} consecutive failures to find captions.`
          );
          break;
        }
      }

      currentIndex++;
      if (currentIndex % 20 === 0) {
          console.log(`Processed ${currentIndex} potential captions...`);
      }
      if (currentIndex > 5000) { // Safety break
          console.warn("Reached 5000 iterations, stopping to prevent infinite loop.");
          break;
      }
    }

    if (captions.length > 0) {
      const fullText = captions.join("\n\n");
      console.log(
        `Extracted ${captions.length} captions. Attempting to copy to clipboard.`
      );

      if (typeof GM_setClipboard !== "undefined") {
        GM_setClipboard(fullText, "text");
        alert(
          `${captions.length} captions extracted and copied to clipboard!`
        );
      } else {
        alert(
          "GM_setClipboard is not available. Captions could not be copied. " +
          "Please ensure Tampermonkey has the correct permissions."
        );
        console.warn("GM_setClipboard is not available.");
      }
    } else {
      alert("No captions were extracted. Check the XPath and the page.");
      console.log("No captions extracted.");
    }
  }

  // --- Add a button to the page to trigger the script ---
  function addButton() {
    const button = document.createElement("button");
    button.textContent = "Copy Recap Captions"; // Changed button text
    button.style.position = "fixed";
    button.style.top = "10px";
    button.style.right = "10px";
    button.style.zIndex = "9999";
    button.style.padding = "10px";
    button.style.backgroundColor = "#007bff"; // Blue color for copy
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";

    button.addEventListener("click", extractCaptions);
    document.body.appendChild(button);

    GM_addStyle(`
      #copyRecapBtn:hover {
        background-color: #0056b3 !important;
      }
    `);
    button.id = "copyRecapBtn";
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    addButton();
  } else {
    window.addEventListener("DOMContentLoaded", addButton);
  }

})();
