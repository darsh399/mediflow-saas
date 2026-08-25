import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { doctorVisit, medicalVisit } from '../../redux/slices/visitSlice'
import doctorApi from '../../api/doctorApi'
import medicalApi from '../../api/medicalApi'
import { Link } from 'react-router-dom'

const AddVisit = ()=>{
  const dispatch = useDispatch()
  const { loading, error, lastResult } = useSelector(s => s.visits)
  const [type, setType] = useState('doctor')
  const [doctors, setDoctors] = useState([])
  const [medicals, setMedicals] = useState([])
  const [selected, setSelected] = useState('')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState({ latitude: '', longitude: '' })
  const [visitPhoto, setVisitPhoto] = useState(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [locationStatus, setLocationStatus] = useState('Requesting live location...')

  useEffect(()=>{
    (async ()=>{ try{ const d = await doctorApi.listDoctors(); setDoctors(d.doctors||d) }catch(e){}; try{ const m = await medicalApi.listMedicals(); setMedicals(m.medicals||m) }catch(e){} })()
    if(!navigator.geolocation) { setLocationStatus('Geolocation is not supported by this browser'); return undefined }
    const watchId = navigator.geolocation.watchPosition(pos=>{
      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      setLocationStatus('Live location active')
    }, err=>setLocationStatus(`Location permission needed: ${err.message}`), { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop())
  }, [])

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      cameraStreamRef.current = stream
      setCameraOpen(true)
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
    } catch (cameraError) {
      alert(cameraError.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access and try again.' : 'Unable to open the camera')
    }
  }

  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop())
    cameraStreamRef.current = null
    setCameraOpen(false)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (blob) setVisitPhoto(new File([blob], `visit-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      closeCamera()
    }, 'image/jpeg', 0.9)
  }

  const handleUseLocationAndSubmit = ()=>{
    if(!location.latitude || !location.longitude) return alert('Current location is not available yet')
    const submitVisit = async ()=>{
      const payload = { currentLatitude: Number(location.latitude), currentLongitude: Number(location.longitude), purpose: 'field_visit', notes }
      if (visitPhoto) payload.visitPhoto = visitPhoto
      if(type === 'doctor') payload.doctorId = selected
      else payload.medicalId = selected
      try{
        if(type==='doctor') await dispatch(doctorVisit(payload)).unwrap()
        else await dispatch(medicalVisit(payload)).unwrap()
        alert('Visit recorded')
      }catch(err){
        alert('Error: '+(err.message||JSON.stringify(err)))
      }
    }
    submitVisit()
  }

  const hasLocation = location.latitude !== '' && location.longitude !== ''
  const mapUrl = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.005}%2C${location.latitude - 0.005}%2C${location.longitude + 0.005}%2C${location.latitude + 0.005}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`
    : ''

  return (
    <div>
      <h2>Add Visit</h2>
      <div className="mb-3">
        <label className="form-label">Type</label>
        <select className="form-select" value={type} onChange={e=>setType(e.target.value)}>
          <option value="doctor">Doctor</option>
          <option value="medical">Medical / Shop</option>
        </select>
      </div>

       <div className="d-flex justify-content-between align-items-center mb-3">
              <h2>Doctors</h2>
              <Link className="btn btn-primary" to="/admin/doctors/add">Add Doctor</Link>
            </div>

      <div className="mb-3">
        <label className="form-label">Select {type === 'doctor' ? 'Doctor' : 'Medical'}</label>
        <select className="form-select" value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">-- choose --</option>
          {(type==='doctor' ? doctors : medicals).map(i=> <option value={i._id} key={i._id}>{i.name} {i.clinicName?('- '+i.clinicName):''}</option>)}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Notes</label>
        <textarea className="form-control" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="form-label">Visit photo (optional)</label>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-primary" onClick={openCamera}><i className="bi bi-camera me-2"></i>Take photo</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => galleryInputRef.current?.click()}><i className="bi bi-image me-2"></i>Choose from gallery</button>
        </div>
        <input ref={cameraInputRef} className="d-none" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>setVisitPhoto(e.target.files?.[0] || null)} />
        <input ref={galleryInputRef} className="d-none" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setVisitPhoto(e.target.files?.[0] || null)} />
        {visitPhoto && <div className="mt-2 small text-success"><i className="bi bi-check-circle me-1"></i>{visitPhoto.name}</div>}
      </div>

      {cameraOpen && <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050 }}><div className="bg-white rounded p-3 w-100" style={{ maxWidth: 560 }}><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="mb-0">Take visit photo</h5><button type="button" className="btn-close" onClick={closeCamera} aria-label="Close camera"></button></div><video ref={videoRef} autoPlay playsInline muted className="w-100 rounded bg-dark" style={{ maxHeight: '65vh', objectFit: 'contain' }}></video><div className="d-flex justify-content-end gap-2 mt-3"><button type="button" className="btn btn-outline-secondary" onClick={closeCamera}>Cancel</button><button type="button" className="btn btn-primary" onClick={capturePhoto}><i className="bi bi-camera me-2"></i>Capture photo</button></div></div></div>}

      <div className="mb-3">
        <div className="small text-muted mb-2">{locationStatus}</div>
        <div className="row g-2 mb-2">
          <div className="col-md-6"><label className="form-label">Current latitude</label><input className="form-control" value={location.latitude} readOnly /></div>
          <div className="col-md-6"><label className="form-label">Current longitude</label><input className="form-control" value={location.longitude} readOnly /></div>
        </div>
        {hasLocation && <iframe title="Current visit location" src={mapUrl} style={{ width: '100%', height: 220, border: 0 }} loading="lazy" />}
      </div>

      <button className="btn btn-primary" onClick={handleUseLocationAndSubmit} disabled={loading || !selected}>{loading? 'Submitting...':'Use my location & Submit'}</button>
      {error && <div className="mt-3 alert alert-danger">{error.message||JSON.stringify(error)}</div>}
      {lastResult && lastResult.message && <div className="mt-3 alert alert-success">{lastResult.message}</div>}
    </div>
  )
}

export default AddVisit
