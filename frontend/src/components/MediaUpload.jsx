import { useState } from "react"

const CLOUD_NAME = "de89rqxat"
const UPLOAD_PRESET = "bookease"

export default function MediaUpload({ onUpload, existing = [] }) {
  const [uploading, setUploading] = useState(false)
  const [media, setMedia] = useState(existing)
  const [error, setError] = useState("")

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    if (media.length + files.length > 6) {
      setError("Maximum 6 files allowed")
      return
    }
    setUploading(true)
    setError("")
    for (const file of files) {
      const maxSize = file.type.startsWith("video") ? 50*1024*1024 : 10*1024*1024
      if (file.size > maxSize) {
        setError(file.name + " is too large")
        continue
      }
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", UPLOAD_PRESET)
        formData.append("cloud_name", CLOUD_NAME)
        const res = await fetch("https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/auto/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.secure_url) {
          const newMedia = [...media, { url: data.secure_url, type: file.type.startsWith("video") ? "video" : "image", public_id: data.public_id }]
          setMedia(newMedia)
          onUpload(newMedia)
        } else {
          setError("Upload failed. Please try again.")
        }
      } catch (err) {
        setError("Upload failed. Check your connection.")
      }
    }
    setUploading(false)
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
              <video src={item.url} className="media-preview" controls />
            ) : (
              <img src={item.url} alt="upload" className="media-preview" />
            )}
            <button className="media-remove" onClick={() => removeMedia(i)}>x</button>
          </div>
        ))}
        {media.length < 6 && (
          <label className="media-add">
            <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} style={{display:"none"}} disabled={uploading} />
            {uploading ? (
              <div className="media-uploading">
                <div className="spinner"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="media-placeholder">
                <span style={{fontSize:"2rem"}}>+</span>
                <span>Add photos or videos</span>
                <span style={{fontSize:"0.75rem", color:"#C4A882"}}>Max 6 files</span>
              </div>
            )}
          </label>
        )}
      </div>
      {error && <p className="error" style={{marginTop:"0.5rem"}}>{error}</p>}
    </div>
  )
}
