import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { doctorVisit, medicalVisit } from '../../redux/slices/visitSlice'
import doctorApi from '../../api/doctorApi'
import medicalApi from '../../api/medicalApi'

const AddVisit = ()=>{
  const dispatch = useDispatch()
  const { loading, error, lastResult } = useSelector(s => s.visits)
  const [type, setType] = useState('doctor')
  const [doctors, setDoctors] = useState([])
  const [medicals, setMedicals] = useState([])
  const [selected, setSelected] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(()=>{ (async ()=>{ try{ const d = await doctorApi.listDoctors(); setDoctors(d.doctors||d) }catch(e){}; try{ const m = await medicalApi.listMedicals(); setMedicals(m.medicals||m) }catch(e){} })() }, [])

  const handleUseLocationAndSubmit = ()=>{
    if(!navigator.geolocation) return alert('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      const payload = { currentLatitude: pos.coords.latitude, currentLongitude: pos.coords.longitude, purpose: 'field_visit', notes }
      if(type === 'doctor') payload.doctorId = selected
      else payload.medicalId = selected
      try{
        if(type==='doctor') await dispatch(doctorVisit(payload)).unwrap()
        else await dispatch(medicalVisit(payload)).unwrap()
        alert('Visit recorded')
      }catch(err){
        alert('Error: '+(err.message||JSON.stringify(err)))
      }
    }, err=> alert('Unable to read location: '+err.message))
  }

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

      <button className="btn btn-primary" onClick={handleUseLocationAndSubmit} disabled={loading || !selected}>{loading? 'Submitting...':'Use my location & Submit'}</button>
      {error && <div className="mt-3 alert alert-danger">{error.message||JSON.stringify(error)}</div>}
      {lastResult && lastResult.message && <div className="mt-3 alert alert-success">{lastResult.message}</div>}
    </div>
  )
}

export default AddVisit
