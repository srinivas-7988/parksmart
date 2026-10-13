import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  LOCS,
  DURATIONS,
  STATUS_META,
  SAMPLE_RECENT
} from '../data/constants'
import { applyPrediction, predictScore, fetchMlPrediction } from '../utils/predict'
import { useClock } from '../hooks/useClock'
import { useLiveAvailability } from '../hooks/useLiveAvailability'
import ParkingMap from '../components/ParkingMap'

export default function Home() {

  const {
    userData,
    myBookings,
    quickBook,
    setActiveTab,
    setBookPrefill,
  } = useApp()

  const { hour12Str, dayStr, greeting } = useClock()
  const liveAvail = useLiveAvailability()

  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchWrapperRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter locations matching typed query
  const filteredLocs = searchQuery.trim()
    ? LOCS.filter((l) =>
        l.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : []

  const handleSelectLocation = (locName) => {
    setSearchQuery(locName)
    setShowSuggestions(false)
    if (setBookPrefill) {
      setBookPrefill({ loc: locName, dur: 2 })
    }
    setActiveTab('book')
  }

  const handleSearch = (e) => {
    e?.preventDefault?.()
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setActiveTab('book')
      return
    }

    const matched = LOCS.find((l) => l.name.toLowerCase().includes(q))
    if (matched) {
      handleSelectLocation(matched.name)
    } else {
      if (setBookPrefill) {
        setBookPrefill({ loc: searchQuery.trim(), dur: 2 })
      }
      setShowSuggestions(false)
      setActiveTab('book')
    }
  }

  const [predTrafficHome, setPredTrafficHome] = useState('medium')

  const [homePred, setHomePred] = useState(
    () => applyPrediction(
      predictScore('medium', true)
    )
  )

  const [activeChip, setActiveChip] = useState(null)

  const [qbLoc, setQbLoc] = useState(
    LOCS[0].name
  )

  const [qbDur, setQbDur] = useState(2)


  // HOME PREDICTION
  useEffect(() => {
    let active = true
    fetchMlPrediction(predTrafficHome).then((res) => {
      if (active && res) setHomePred(res)
    })
    return () => { active = false }
  }, [predTrafficHome])


  // USER NAME
  // Safe handling for backend data

  const fullName =
    userData?.name ||
    userData?.full_name ||
    'Arjun Kumar'

  const nameParts = fullName
    .trim()
    .split(/\s+/)

  const firstName =
    nameParts[0] || 'Arjun'

  const restName =
    nameParts.slice(1).join(' ') || 'Kumar'


  // RECENT BOOKINGS

  const recent = myBookings.length
    ? myBookings
      .slice(0, 3)
      .map((b) => ({
        loc: b.loc || 'Parking Zone',
        slot: `Slot ${b.slot || 'N/A'}`,
        date: b.date || b.bookedAt || 'Recently',
        status: b.status || 'active',
        total: b.total || 0
      }))
    : SAMPLE_RECENT.map((s) => ({
      ...s,
      slot: `Slot ${s.slot}`
    }))


  return (
    <>

      <div style={{ padding: '.5rem 0 1.25rem' }}>

        <div
          className="muted"
          style={{
            fontSize: '.82rem'
          }}
        >
          {greeting || 'Good morning,'}
        </div>

        <div className="greeting-name">
          {firstName} <span>{restName}</span> 👋
        </div>

      </div>


      <div className="search-bar-wrapper" ref={searchWrapperRef}>
        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              if (searchQuery.trim()) setShowSuggestions(true)
            }}
            placeholder="Search locations in Bangalore (e.g. Brigade Road, MG Road...)"
          />

          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('')
                setShowSuggestions(false)
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}

          <button type="submit" className="search-bar-btn">
            Search
          </button>
        </form>

        {/* LIVE LOCATION SUGGESTIONS POPUP */}
        {showSuggestions && searchQuery.trim() && (
          <div className="search-suggestions-popup">
            <div className="suggestions-header">
              <span>📍 Suggested Locations ({filteredLocs.length})</span>
              <span className="suggestions-tip">Click to book</span>
            </div>

            {filteredLocs.length > 0 ? (
              <div className="suggestions-list">
                {filteredLocs.map((item) => (
                  <div
                    key={item.name}
                    className="suggestion-item"
                    onClick={() => handleSelectLocation(item.name)}
                  >
                    <div className="suggestion-left">
                      <span className="suggestion-pin">🅿️</span>
                      <div>
                        <div className="suggestion-name">{item.name}</div>
                        <div className="suggestion-sub">
                          Bangalore · ₹30 / hr
                        </div>
                      </div>
                    </div>

                    <div className="suggestion-right">
                      <span
                        className="suggestion-badge"
                        style={{
                          background: item.avail > 60 ? 'rgba(34,197,94,.15)' : 'rgba(245,158,11,.15)',
                          color: item.avail > 60 ? '#22c55e' : '#f59e0b',
                        }}
                      >
                        {item.avail}% Avail
                      </span>
                      <span className="suggestion-arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="suggestions-empty">
                No parking zones found for "{searchQuery}". Try "Brigade", "MG Road", "Indiranagar", "Koramangala"...
              </div>
            )}
          </div>
        )}
      </div>


      {/* STATS */}

      <div
        className="stats-strip fade"
        style={{
          gridTemplateColumns: '1fr 1fr'
        }}
      >

        <div className="mini-stat">

          <div className="v">
            {liveAvail}
          </div>

          <div className="l">
            Slots available now
          </div>

        </div>


        <div className="mini-stat">

          <div className="v">
            ₹30
          </div>

          <div className="l">
            Per hour flat
          </div>

        </div>

      </div>


      {/* ML PREDICTION */}

      <div className="pred-card fade">

        <div
          className="row-between card-title"
          style={{
            marginBottom: '.75rem'
          }}
        >

          <span>
            ⚡ Live Slot Forecast
          </span>

          <span className="ai-badge">
            REAL TIME
          </span>

        </div>


        <div className="row-between">

          <div
            className={`pred-status ${homePred.available
                ? 'green'
                : 'red'
              }`}
          >
            {
              homePred.available
                ? 'Available'
                : 'Full'
            }
          </div>


          <div className="pred-conf-bar">

            <div
              className="pred-conf-fill"
              style={{
                width: `${homePred.confidence}%`
              }}
            />

          </div>


          <div className="pred-pct">
            {homePred.confidence}%
          </div>

        </div>


        <div className="pred-details">

          <div className="pred-chip">
            🕐 <span>{hour12Str}</span>
          </div>

          <div className="pred-chip">
            📅 <span>{dayStr}</span>
          </div>


          <div className="pred-chip">

            🚦{' '}

            <select
              value={predTrafficHome}
              onChange={(e) =>
                setPredTrafficHome(
                  e.target.value
                )
              }
            >

              <option value="low">
                Low traffic
              </option>

              <option value="medium">
                Medium traffic
              </option>

              <option value="high">
                High traffic
              </option>

            </select>

          </div>


          <div className="pred-chip">
            📍 Brigade Rd
          </div>

        </div>

      </div>





      {/* BANGALORE PARKING MAP */}
      <ParkingMap />

      {/* NEARBY ZONES */}

      <div className="section-hd fade">

        <h2>
          📍 Nearby Zones
        </h2>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setActiveTab('book')
          }}
        >
          Book now →
        </a>

      </div>


      <div className="loc-scroll fade">

        {LOCS.map((l) => {

          const color =
            l.avail > 65
              ? '#22c55e'
              : l.avail > 40
                ? '#f59e0b'
                : '#ef4444'

          return (

            <div
              key={l.name}
              className={`loc-chip${activeChip === l.name
                  ? ' active'
                  : ''
                }`}
              onClick={() =>
                setActiveChip(l.name)
              }
            >

              <div className="n">
                {l.name}
              </div>

              <div className="s">
                {Math.round(
                  (l.slots * l.avail) / 100
                )}
                /{l.slots} available
              </div>

              <div className="bar">

                <i
                  style={{
                    width: `${l.avail}%`,
                    background: color
                  }}
                />

              </div>

            </div>

          )
        })}

      </div>


      {/* QUICK RESERVE */}

      <div className="section-hd fade">

        <h2>
          ⚡ Quick Reserve
        </h2>

      </div>


      <div
        className="card fade"
        style={{
          marginBottom: '1.5rem'
        }}
      >

        <div
          style={{
            display: 'flex',
            gap: '.75rem',
            marginBottom: '.875rem'
          }}
        >

          <select
            className="select"
            value={qbLoc}
            onChange={(e) =>
              setQbLoc(e.target.value)
            }
          >

            {LOCS.map((l) => (

              <option
                key={l.name}
                value={l.name}
              >
                {l.name}
              </option>

            ))}

          </select>


          <select
            className="select"
            value={qbDur}
            onChange={(e) =>
              setQbDur(
                Number(e.target.value)
              )
            }
          >

            {DURATIONS.map((d) => (

              <option
                key={d}
                value={d}
              >
                {d} hr · ₹{d * 30}
              </option>

            ))}

          </select>

        </div>


        <button
          className="btn"
          style={{
            boxShadow:
              '0 6px 20px rgba(0,200,150,.25)'
          }}
          onClick={() =>
            quickBook(
              qbLoc,
              qbDur
            )
          }
        >
          Reserve Now →
        </button>

      </div>


      {/* RECENT ACTIVITY */}

      <div className="section-hd fade">

        <h2>
          📋 Recent Activity
        </h2>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setActiveTab('mybookings')
          }}
        >
          See all →
        </a>

      </div>


      <div className="fade">

        {recent.map((r, i) => {

          const statusData =
            STATUS_META[r.status] ||
            STATUS_META.active ||
            [
              '',
              '',
              'Active',
              '🅿️',
              ''
            ]

          const [
            bgPill,
            ,
            lbl,
            icon,
            bgIcon
          ] = statusData

          return (

            <div
              className="recent-item"
              key={i}
            >

              <div
                className={`recent-icon ${bgIcon || ''}`}
              >
                {icon || '🅿️'}
              </div>


              <div
                style={{
                  flex: 1
                }}
              >

                <div className="recent-loc">
                  {r.loc}
                </div>

                <div className="recent-meta">
                  {r.slot} · {r.date} · ₹{r.total}
                </div>

              </div>


              <span
                className={`status-pill ${bgPill || ''
                  }`}
              >
                {lbl || 'Active'}
              </span>

            </div>

          )

        })}

      </div>

    </>
  )
}