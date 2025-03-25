import React, { useState } from "react";

const Present = () => {
  const [fileUrl, setFileUrl] = useState(null);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      // Convert file to a URL for embedding
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const fileBlob = new Blob([e.target.result], { type: selectedFile.type });
        const url = URL.createObjectURL(fileBlob);
        setFileUrl(url);
      };
      fileReader.readAsArrayBuffer(selectedFile);
    } else {
      alert("Please upload a valid PowerPoint presentation (.pptx) file.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100 min-h-screen">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Upload and Present Your Slides</h1>
      <input
        type="file"
        accept=".pptx"
        onChange={handleFileChange}
        className="mb-4 p-2 border border-gray-300 rounded-lg"
      />
      {fileUrl && (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
          width="800"
          height="600"
          frameBorder="0"
          className="mt-6 border border-gray-400 rounded-lg"
          title="Presentation Viewer"
        ></iframe>
      )}
    </div>
  );
};

export default Present;
