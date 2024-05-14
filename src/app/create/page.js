'use client';

import { DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import {useState, useEffect} from "react";
import { Button, Dropdown, Modal, InputGroup, Form, ListGroup, Card, Alert } from "react-bootstrap";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import {socket} from "../socket";
import { Checkbox, CircularProgress } from "@mui/material";
import airlineImages from "./airlineImages.json";
import "./create.css";
import moment from "moment-timezone";

export default function Create() {
  const [showCarModal, setCarModal] = useState(false);
  const [showPlaneModal, setPlaneModal] = useState(false);
  const [showLocationModal, setLocationModal] = useState(false);
  const [airline, setAirline] = useState();
  const [flightNum, setFlightNum] = useState();
  const [flightDate, setFlightDate] = useState();
  const [flightNumValid, setFlightNumValid] = useState(false);
  const [address, setAddress] = useState();
  const [arrivalTime, setArrivalTime] = useState();
  const [departureTime, setDepartureTime] = useState();
  const [segments, setSegments] = useState([]);
  const [addingSegment, setAddingSegment] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [arrivalTimeChecked, setArrivalTimeChecked] = useState(false);
  const iana = moment.tz.guess();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  function toggleAddCarSegmentModal() {
    setCarModal(!showCarModal);
  }

  function toggleAddLocationSegmentModal() {
    setLocationModal(!showLocationModal);
  }

  function toggleAddPlaneSegmentModal() {
    setPlaneModal(!showPlaneModal);
  }

  function addPlaneSegment() {
    setAddingSegment(true);
    socket.emit("add-plane-segment", {flightNum, airline: airline.split(".")[1], flightDate}, (data) => {
      setPlaneModal(false);
      setTimeout(() => {
        setAddingSegment(false);
      }, 1000);
      
      const depDate = moment(data.depTime);
      const arrDate = moment(data.arrTime);
      setSegments([...segments, {
        type: "plane",
        depAddress: data.depAddress,
        arrAddress: data.arrAddress,
        toFrom: data.depAirport + " Airport → " + data.arrAirport + " Airport", 
        flightId: data.flightId, 
        depString: getDepArrString(true, depDate),
        arrString: getDepArrString(false, arrDate),
        bg: airlineImages[data.flightId.slice(0, 2)]}]);
    });
  }

  function addLocationSegment() {
    setAddingSegment(true);
    socket.emit("add-location-segment", {address, arrivalTime, departureTime}, () => {

      setSegments([...segments, {
        type: "location",
        address,
        depString: getDepArrString(true, departureTime, null),
        arrString: arrivalTime ? getDepArrString(false, arrivalTime, null) : null
      }]);
      setLocationModal(false);
      setAddingSegment(false);
    });
  }

  function getDepArrString(departing, date) {
    const tz = date.tz(iana).format("z");
    const am = date.hour() < 12;
    return `${departing ? "Departing" : "Arriving"} on ${date.format("MMMM")} ${date.date()}, ${date.year()} at ${am? (date.hour() == 0 ? 12 : date.hour()) : date.hour() - 12}:${(date.minutes() < 9 ? "0" : "") + date.minutes()}${am ? "AM" : "PM"}`;
  }

  async function checkFlightNumber(num) {
    socket.emit("test-flight-number", num, (valid) => {
      setFlightNum(num);
      setFlightNumValid(valid);
    });
  }

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle>Add Travel Segment</Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick = {toggleAddCarSegmentModal}>Car</Dropdown.Item>
          <Dropdown.Item onClick = {toggleAddPlaneSegmentModal}>Plane</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <br></br>
      <Button onClick={toggleAddLocationSegmentModal}>Add Location Segment</Button>
      <ListGroup>
        {segments.map((segment, i) => (
          <ListGroup.Item key={i} style={{border: "none"}}>
            {segment.type == "plane" && <Card style={{backgroundImage: `url(${segment.bg})`, backgroundSize: "cover"}}>
              <Card.Body>
                <Card.Title>{segment.toFrom}</Card.Title>
                <Card.Subtitle>{segment.flightId}</Card.Subtitle>
                <br></br>
                <Card.Subtitle>{segment.depString}</Card.Subtitle>
                <br></br>
                <Card.Subtitle>{segment.arrString}</Card.Subtitle>
              </Card.Body>
            </Card>}
            {segment.type == "location" && <Card>
              <Card.Body>
                <Alert variant="warning" show={i != 0 && segment.depAddress != (segments[i-1].type == "location" ? segments[i-1].address : segments[i-1].arrAddress)}>A connection is needed between this segment and the previous one.</Alert>
                <Card.Title>{segment.address}</Card.Title>
                <br></br>
                <Card.Subtitle>{segment.arrString || "Starting here!"}</Card.Subtitle>
                <br></br>
                <Card.Subtitle>{segment.depString}</Card.Subtitle>
              </Card.Body>
            </Card>}
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Modal show={segments.length == 0 || showLocationModal}>
        <Modal.Header className="modal-padding">
          <Modal.Title>{segments.length == 0 ? "Where is your Journey starting?" : "Add Location Segment"}</Modal.Title>
          {segments.length > 0 && <Button onClick = {toggleAddLocationSegmentModal}>Cancel</Button>}
        </Modal.Header> 
        <fieldset disabled={addingSegment} className="modal-padding">
          <Form.Control placeholder="Address" autoComplete="street-address" onChange={(e) => {setAddress(e.target.value)}}></Form.Control>
          <br></br>
          <Checkbox style={{display: segments.length > 0 ? "none" : "inline-block"}} onChange={() => {setArrivalTimeChecked(!arrivalTimeChecked)}}></Checkbox>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateTimePicker label = "Arrival Time" disablePast={true} onAccept={setArrivalTime} disabled={!arrivalTimeChecked && segments.length == 0}></DateTimePicker>
          </LocalizationProvider>
          <br></br>
          <br></br>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateTimePicker label = "Departure Time" disablePast={true} onAccept={setDepartureTime} minDate={arrivalTimeChecked ? arrivalTime : null} disabled={arrivalTimeChecked && !arrivalTime}></DateTimePicker>
          </LocalizationProvider>
          <br></br>
          <br></br>
          <Button className="addSegment" disabled={!address || !departureTime || ((segments.length > 0 || arrivalTimeChecked) && !arrivalTime)} onClick={addLocationSegment}>{addingSegment ? "" : "Add Location"}
            <CircularProgress size={addingSegment ? 25 : 0} color="success"></CircularProgress></Button>
        </fieldset>
      </Modal>
      <Modal show ={showCarModal} animation ={true}>
        <Modal.Header>
          <Modal.Title>Add Segment</Modal.Title>
          <Button onClick = {toggleAddCarSegmentModal}>Cancel</Button>
        </Modal.Header>
        <br></br>
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DateTimePicker label = "Pickup Time"></DateTimePicker>
        </LocalizationProvider>
        <br></br>
        <Button onClick={() => {console.log(rideType)}}>Add</Button>
      </Modal>
      <Modal show = {showPlaneModal} animation = {true}>
        <Modal.Header>
          <Modal.Title>Add Segment</Modal.Title>
          <Button onClick = {toggleAddPlaneSegmentModal}>Cancel</Button>
        </Modal.Header>
        <fieldset disabled={addingSegment} className="modal-padding">
          <Dropdown onSelect={(_, e) => {setAirline(e.target.textContent + "." + e.target.getAttribute("code"));}}>
            <Dropdown.Toggle className="addSegment">{airline ? airline.split(".")[0] : "Select Airline"}</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item code="AA">American Airlines</Dropdown.Item>
              <Dropdown.Item code="DL">Delta Airlines</Dropdown.Item>
              <Dropdown.Item code="F9">Frontier Airlines</Dropdown.Item>
              <Dropdown.Item code="HA">Hawaiian Airlines</Dropdown.Item>
              <Dropdown.Item code="B6">JetBlue Airlines</Dropdown.Item>
              <Dropdown.Item code="WN">Southwest Airlines</Dropdown.Item>
              <Dropdown.Item code="NK">Spirit Airlines</Dropdown.Item>
              <Dropdown.Item code="UA">United Airlines</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <br></br>
          <InputGroup>
            <Form.Control placeholder="Flight Number" isValid ={showPlaneModal && flightNumValid} isInvalid ={flightNum && !flightNumValid} onChange={(e) => {checkFlightNumber(e.target.value);}}></Form.Control>
          </InputGroup>
          <br></br>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker className="addSegment" label ="Departure Date" disablePast={true} onAccept={setFlightDate}></DatePicker>
          </LocalizationProvider>
          <br></br>
          <br></br>
          <Button className="addSegment" disabled={!flightNumValid || !airline || !flightDate} onClick={addPlaneSegment}>
            {addingSegment ? "" : "Add"}
            <CircularProgress size={addingSegment ? 25 : 0} color="success"></CircularProgress>
          </Button>
        </fieldset>
      </Modal>
    </>
  );
}
