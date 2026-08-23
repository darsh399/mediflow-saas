import { useEffect, useState } from 'react'
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

  const handleUseLocationAndSubmit = ()=>{
    if(!location.latitude || !location.longitude) return alert('Current location is not available yet')
    const submitVisit = async ()=>{
      const payload = { currentLatitude: location.latitude, currentLongitude: location.longitude, purpose: 'field_visit', notes }
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
