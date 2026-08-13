import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  LOCS,
  DURATIONS,
  STATUS_META,
  SAMPLE_RECENT
} from '../data/constants'
import { applyPrediction, predictScore } from '../utils/predict'
import { useClock } from '../hooks/useClock'
import { useLiveAvailability } from '../hooks/useLiveAvailability'

export default function Home() {

  const {
    userData,
    myBookings,
    activeTab,
    quickBook,
    setActiveTab
  } = useApp()

  const { hour12Str, dayStr } = useClock()
  const liveAvail = useLiveAvailability()

  const [predTrafficHome, setPredTrafficHome] = useState('medium')
  const [mlTraffic, setMlTraffic] = useState('medium')

  const [homePred, setHomePred] = useState(
    () => applyPrediction(
      predictScore('medium', true)
    )
  )

  const [mlPred, setMlPred] = useState(
    () => applyPrediction(
      predictScore('medium', false)
    )
  )

  const [activeChip, setActiveChip] = useState(null)

  const [qbLoc, setQbLoc] = useState(
    LOCS[0].name
  )

  const [qbDur, setQbDur] = useState(2)


  // HOME PREDICTION

  useEffect(() => {
    setHomePred(
      applyPrediction(
        predictScore(predTrafficHome, true)
      )
    )
  }, [predTrafficHome])


  // ML PREDICTION

  useEffect(() => {
    setMlPred(
      applyPrediction(
        predictScore(mlTraffic, false)
      )
    )
  }, [mlTraffic])


  // RE-RUN WHEN HOME TAB OPENS

  useEffect(() => {

    if (activeTab === 'home') {

      setMlPred(
        applyPrediction(
          predictScore(mlTraffic, false)
        )
      )

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])


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
          Good evening,
        </div>

        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700
          }}
        >
          {firstName} {restName} 👋
        </div>

      </div>


      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '.75rem'
        }}
      >
        🔍
        <span
          style={{
            cursor: 'pointer',
            marginLeft: '.75rem'
          }}
        >
          🗺
        </span>
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
            🧠 ML Prediction
          </span>

          <span className="ai-badge">
            RANDOM FOREST
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


      {/* LIVE PREDICTION */}

      <div
        className="card fade"
        style={{
          marginBottom: '1.5rem'
        }}
      >

        <div className="card-title">
          🔮 Live Prediction
        </div>


        <div
          style={{
            marginBottom: '.75rem'
          }}
        >

          <label className="label">
            Traffic Level
          </label>

          <select
            className="select"
            value={mlTraffic}
            onChange={(e) =>
              setMlTraffic(
                e.target.value
              )
            }
          >

            <option value="low">
              Low
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>

          </select>

        </div>


        <div className="pill row-between">

          <div>

            <div
              className="muted"
              style={{
                fontSize: '.75rem',
                marginBottom: '.25rem'
              }}
            >
              Prediction
            </div>

            <div
              className={`pred-status ${mlPred.available
                  ? 'green'
                  : 'red'
                }`}
              style={{
                fontSize: '1.3rem'
              }}
            >
              {
                mlPred.available
                  ? 'Available'
                  : 'Full'
              }
            </div>

          </div>


          <div
            style={{
              textAlign: 'right'
            }}
          >

            <div
              className="muted"
              style={{
                fontSize: '.75rem',
                marginBottom: '.25rem'
              }}
            >
              Confidence
            </div>

            <div
              className="mono"
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#00c896'
              }}
            >
              {mlPred.confidence}%
            </div>

          </div>

        </div>

      </div>


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