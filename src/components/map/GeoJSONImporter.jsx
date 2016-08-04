import React, { PropTypes } from 'react'
import ol from 'openlayers'

import { mapReferenceRequestSignal } from '../../signals'

import RaisedButton from 'material-ui/RaisedButton'
import ActionSystemUpdateAlt from 'material-ui/svg-icons/action/system-update-alt'
import TextField from 'material-ui/TextField'

export default class GeoJSONImporter extends React.Component {
  constructor (props) {
    super(props)
    this.data = ''

    this.onMapReferenceReceived_ = this.onMapReferenceReceived_.bind(this)
    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)

    mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived_)
  }

  render () {
    return (
      <div style={this.props.style}>
        <TextField
          floatingLabelText="Paste GeoJSON data here:"
          hintText="GeoJSON"
          multiLine={true}
          rowsMax={10}
          textareaStyle={{height: '85%'}}
          fullWidth={true}
          onChange={this.handleChange_} />
        <RaisedButton
          label="Import GeoJSON"
          icon={<ActionSystemUpdateAlt />}
          onClick={this.handleClick_} />
      </div>
    )
  }

  onMapReferenceReceived_ (map) {
    this.map = map
  }

  handleChange_ (e) {
    this.data = e.target.value
  }

  handleClick_ (e) {
    let geojsonFormat = new ol.format.GeoJSON()
    let features = geojsonFormat.readFeatures(this.data, {featureProjection: 'EPSG:3857'})

    let source = new ol.source.Vector()
    source.addFeatures(features)

    let layer = new ol.layer.Vector()
    layer.setSource(source)

    this.map.addLayer(layer)
  }
}

GeoJSONImporter.propTypes = {
  style: PropTypes.object
}
