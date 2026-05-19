import { useState } from "react"

const CLOUD_NAME = "de89rqxat"
const UPLOAD_PRESET = "bookease"

export default function MediaUpload({ onUpload, existing = [] }) {
  const [uploading, setUploading] = useState(false)
  const [media, setMedia] = useState(existing)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState("")

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    if (media.length + files.length > 6) {
      setError("Maximum 6 files allowed")
      return
    }
    setUploading(true)
    setError("")

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx]
      setProgress(`Uploading ${idx + 1} of ${files.length}...`)

      const maxSize = file.type.startsWith("video") ? 50*1024*1024 : 10*1024*1024
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Max ${file.type.startsWith("video") ? "50MB" : "10MB"}`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", UPLOAD_PRESET)

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
          { method: "POST", body: formData }
        )

        if (!res.ok) {
          const errData = await res.json()
          setError("Upload failed: " + (errData.error?.message || "Please check your Cloudinary preset is set to Unsigned"))
          continue
        }

        const data = await res.json()

        if (data.secure_url) {
          const updated = [...media, {
            url: data.secure_url,
            type: file.type.startsWith("video") ? "video" : "image",
            public_id: data.public_id
          }]
          setMedia(updated)
          onUpload(updated)
        }
      } catch (err) {
        setError("Upload failed. Check your internet connection.")
      }
    }
    setUploading(false)
    setProgress("")
  }

  const removeMedia = (index) => {
    const updated = media.filter((_, i) => i !== index)
    setMedia(updated)
    onUpload(updated)
  }

  return (
    <div className="media-upload">
      <div className="media-grid">
        {media.map((item, i) => (
          <div key={i} className="media-item">
            {item.type === "video" ? (
              <video src={item.url} className="media-preview" />
            ) : (
              <img src={item.url} alt="upload" className="media-preview" />
            )}
            <button type="button" className="media-remove" onClick={() => removeMedia(i)}>✕</button>
          </div>
        ))}

        {media.length < 6 && (
          <label className="media-add">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
              multiple
              onChange={handleFileChange}
              style={{display:"none"}}
              disabled={uploading}
            />
            {uploading ? (
              <div className="media-uploading">
                <div className="spinner"></div>
                <span>{progress || "Uploading..."}</span>
              </div>
            ) : (
              <div className="media-placeholder">
                <span style={{fontSize:"2rem"}}>📷</span>
                <span>Tap to add</span>
                <span style={{fontSize:"0.7rem", color:"#C4A882"}}>Photos or videos</span>
              </div>
            )}
          </label>
        )}
      </div>
      {error && <p className="error" style={{marginTop:"0.5rem", fontSize:"0.8rem"}}>{error}</p>}
      {media.length > 0 && (
        <p className="muted" style={{marginTop:"0.5rem", fontSize:"0.8rem"}}>{media.length} file(s) uploaded successfully ✓</p>
      )}
    </div>
  )
}
