/**
 * @file React Component to display and adjust the rotation of the map view.
 */

import Easing from 'ol/easing'
import Extent from 'ol/extent'
import VectorLayer from 'ol/layer/vector'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { showSnackbarMessage } from '../../actions/snackbar'

import { coordinateFromLonLat } from '../../utils/geography'

import {
  mapReferenceRequestSignal,
  fitAllFeaturesSignal,
  mapViewToExtentSignal
} from '../../signals'

import IconButton from '@material-ui/core/IconButton'
import DeviceGpsFixed from '@material-ui/icons/GpsFixed'
import ActionAllOut from '@material-ui/icons/AllOut'

/**
 * React Component to adjust the view so that it fits all of the current features.
 *
 * @param {Object} props properties of the react component
 * @property {number} margin amount of margin to leave between the features
 * and the border of the view
 * @property {number} duration the amount of time the transition should take (in ms)
 *
 * @emits {mapReferenceRequestSignal} requests map reference.
 */
class FitAllFeaturesButton extends React.Component {
  /**
   * Constructor that binds context to functions,
   * and requests map reference with callback.
   *
   * @param {Object} props properties of the react component
   * @property {number} margin amount of margin to leave between the features
   * and the border of the view
   * @property {number} duration the amount of time the transition should take (in ms)
   *
   * @emits {mapReferenceRequestSignal} requests map reference.
   */
  constructor (props) {
    super(props)

    this._onMapReferenceReceived = this._onMapReferenceReceived.bind(this)
    this._handleClick = this._handleClick.bind(this)
    this._geolocationReceived = this._geolocationReceived.bind(this)

    this._CurrentIcon = ActionAllOut

    fitAllFeaturesSignal.add(this._handleClick)

    mapReferenceRequestSignal.dispatch(this._onMapReferenceReceived)
  }

  render () {
    return (
      <IconButton onClick={this._handleClick} tooltip='Fit all features'>
        <this._CurrentIcon />
      </IconButton>
    )
  }

  /**
   * Callback for receiving the map reference and saving it.
   *
   * @param {ol.Map} map the map to attach the event handlers to
   */
  _onMapReferenceReceived (map) {
    this.map = map
  }

  /**
   * Event handler that calculates the target extent and fits it into the view.
   *
   * @param {Event} e the event fired from the IconButton component
   */
  _handleClick (e) {
    let feasibleLayers = this.map.getLayers().getArray().filter(this._isLayerFeasible)
    let featureArrays = feasibleLayers.map(l => l.getSource().getFeatures())
    let features = [].concat.apply([], featureArrays)
    let featureExtents = features.map(f => {
      const geometry = f.getGeometry()
      return geometry ? geometry.getExtent() : undefined
    }).filter(e => e !== undefined)

    if (featureExtents.length === 0) {
      this.props.dispatch(showSnackbarMessage(
        'No valid feature extents avaiable, trying to get geolocation instead'
      ))

      this._CurrentIcon = DeviceGpsFixed

      // This only works on secure origins
      if ('geolocation' in window.navigator) {
        window.navigator.geolocation.getCurrentPosition(this._geolocationReceived)
      }

      return
    }

    this._CurrentIcon = ActionAllOut

    console.log(featureExtents)

    const mergedExtent = featureExtents.reduce(
      (bigExtent, currentExtent) => Extent.extend(bigExtent, currentExtent),
      Extent.createEmpty()
    )

    const bufferedExtent = Extent.buffer(mergedExtent, this.props.margin)

    mapViewToExtentSignal.dispatch(bufferedExtent)
  }

  /**
   * Returns whether a given layer is visible and has an associated vector
   * source.
   *
   * @param {ol.layer.Layer} layer  the layer to test
   * @return {boolean} whether the layer is visible and has an associated
   *         vector source
   */
  _isLayerFeasible (layer) {
    return layer && layer.getVisible() && layer instanceof VectorLayer
  }

  /**
   * Event handler that centers the map to the received position.
   *
   * @param {Object} position the position object provided by the geolocation service
   */
  _geolocationReceived (position) {
    const view = this.map.getView()
    const center = coordinateFromLonLat(
      [position.coords.longitude, position.coords.latitude]
    )
    view.animate({
      pan: center,
      duration: this.props.duration,
      easing: Easing.easeOut
    })
  }
}

FitAllFeaturesButton.propTypes = {
  duration: PropTypes.number,
  margin: PropTypes.number,
  dispatch: PropTypes.func
}

export default connect()(FitAllFeaturesButton)
