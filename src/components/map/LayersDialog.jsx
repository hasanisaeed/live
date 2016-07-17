/**
* @file React Component for the layer settings dialog.
*/

import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import { List, ListItem } from 'material-ui/List'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import TextField from 'material-ui/TextField'
import Toggle from 'material-ui/Toggle'
import VisibilityOff from 'material-ui/svg-icons/action/visibility-off'

import { closeLayersDialog, renameLayer, setSelectedLayerInLayersDialog,
         toggleLayerVisibility, removeLayer } from '../../actions/layers'
import { selectMapSource } from '../../actions/map'
import { LayerType, labelForLayerType, iconForLayerType } from '../../model/layers'
import { Sources, labelForSource } from '../../model/sources'
import { createValidator, required } from '../../utils/validation'

/**
 * Form for the basic settings of a layer that is applicable to all layers
 * regardless of its type.
 */
class BasicLayerSettingsFormPresentation extends React.Component {
  render () {
    const { fields: { label }, layer } = this.props
    const { onToggleLayerVisibility } = this.props

    return (
      <div style={{ paddingBottom: '1em' }}>
        <TextField {...label} floatingLabelText="Layer name"
          style={{ width: '100%' }}
          spellCheck="false" errorText={label.touched && label.error}
        />
        <div>&nbsp;</div>
        <Toggle label="Visible" labelPosition="right"
          toggled={layer.visible}
          onToggle={onToggleLayerVisibility}
        />
      </div>
    )
  }
}

BasicLayerSettingsFormPresentation.propTypes = {
  fields: PropTypes.object.isRequired,
  layer: PropTypes.object,
  layerId: PropTypes.string,

  onToggleLayerVisibility: PropTypes.func
}

/**
 * Container of the form that shows the fields that the user can use to
 * edit the basic settings of a layer.
 */
const BasicLayerSettingsForm = reduxForm(
  // config
  {
    form: 'basicLayerSettings',
    fields: ['label'],
    validate: createValidator({
      label: required
    })
  },
  // mapStateToProps
  (state, ownProps) => ({
    initialValues: {
      label: ownProps.layer.label
    }
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    asyncValidate: values => {
      // This is a horrible abuse of the async validation feature in
      // redux-form; basically the only thing we want is to fire a callback
      // routine if the synchronous validation of the label field passed
      // so we can fire an action that updates the name of the layer.
      dispatch(renameLayer(ownProps.layerId, values.label))

      // This function needs to return a Promise so we create one
      return Promise.resolve()
    },
    asyncBlurFields: ['label'],

    onToggleLayerVisibility () {
      dispatch(toggleLayerVisibility(ownProps.layerId))
    }
  })
)(BasicLayerSettingsFormPresentation)

/* ********************************************************************* */

/**
 * Presentation component for the settings of a layer.
 */
class LayerSettingsContainerPresentation extends React.Component {
  /**
   * Creates the child components that allows the user to update the
   * layer-specific settings of the selected layer.
   *
   * @param {Object} layer  the layer being edited
   * @return {Object[]}  the list of child components to add
   */
  createChildrenForLayer (layer) {
    // TODO: this is not nice here; it should be refactored into separate
    // React components, possibly in additional files
    if (layer.type === LayerType.BASE) {
      const sourceRadioButtons = _.map(Sources, source => (
        <RadioButton value={source} key={source}
          label={labelForSource(source)}
          style={{ marginTop: 5 }}/>
      ))
      return [
        <p key="header">Layer data source</p>,
        <RadioButtonGroup name="source.base" key="baseProperties"
          valueSelected={layer.parameters.source}
          onChange={this.props.onLayerSourceChanged}>
          {sourceRadioButtons}
        </RadioButtonGroup>
      ]
    } else {
      return []
    }
  }

  render () {
    const { layer, layerId } = this.props

    if (typeof layerId === 'undefined') {
      // No layer is selected; let's show a hint that the user should
      // select a layer
      return (
        <div style={{ textAlign: 'center', marginTop: '2em' }}>
          Please select a layer from the layer list.
        </div>
      )
    }

    if (typeof layer === 'undefined') {
      // A layer is selected by the user but the layer does not exist
      // any more. We just bail out silently.
      return false
    }

    return (
      <div>
        <BasicLayerSettingsForm layer={layer} layerId={layerId} />
        {this.createChildrenForLayer(layer)}
      </div>
    )
  }
}

LayerSettingsContainerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  onLayerSourceChanged: PropTypes.func
}

/**
 * Container of the panel that contains the settings of a layer.
 */
const LayerSettingsContainer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    layer: state.map.layers.byId[ownProps.layerId]
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerSourceChanged (event, value) {
      dispatch(selectMapSource(value))
    }
  })
)(LayerSettingsContainerPresentation)

/* ********************************************************************* */

/**
 * Presentation component for a list that shows the currently added layers.
 */
class LayerListPresentation extends React.Component {
  render () {
    const { layers, order, selectedLayer, onLayerSelected } = this.props
    const hiddenIcon = <VisibilityOff />
    const getListItemStyle = layer => (
      selectedLayer === layer ? 'selected-list-item' : undefined
    )
    const listItems = []

    for (let layerId of order) {
      const layer = layers[layerId]

      if (!layer) {
        console.warn('Non-existent layer found in layer ordering; this ' +
                     'is probably a bug!')
        continue
      }

      listItems.push(
        <ListItem
          key={layerId}
          primaryText={layer.label}
          secondaryText={labelForLayerType(layer.type)}
          leftIcon={iconForLayerType(layer.type)}
          rightIcon={layer.visible ? undefined : hiddenIcon}
          className={getListItemStyle(layerId)}
          onTouchTap={_.partial(onLayerSelected, layerId)} />
      )
    }

    return (
      <List className="dialog-sidebar">
        {listItems}
      </List>
    )
  }
}

LayerListPresentation.propTypes = {
  layers: PropTypes.object.isRequired,
  order: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedLayer: PropTypes.string,

  onLayerSelected: PropTypes.func
}

LayerListPresentation.defaultProps = {
  layers: {},
  order: []
}

/**
 * Container for the layer list that binds it to the Redux store.
 */
const LayerList = connect(
  // mapStateToProps
  state => ({
    layers: state.map.layers.byId,
    order: state.map.layers.order,
    selectedLayer: state.dialogs.layerSettings.selectedLayer
  }),
  // mapDispatchToProps
  dispatch => ({
    onLayerSelected (layerId) {
      dispatch(setSelectedLayerInLayersDialog(layerId))
    }
  })
)(LayerListPresentation)

/* ********************************************************************* */

/**
 * Presentation component for the dialog that shows the configuration of
 * layers in the map.
 */
class LayersDialogPresentation extends React.Component {
  constructor (props) {
    super(props)
    this.removeSelectedLayer_ = this.removeSelectedLayer_.bind(this)
  }

  render () {
    const { dialogVisible, selectedLayer } = this.props
    const { onClose } = this.props
    const actions = [
      <FlatButton label="Remove layer" disabled={ !selectedLayer }
        onTouchTap={this.removeSelectedLayer_} />,
      <FlatButton label="Done" primary={true} onTouchTap={onClose} />
    ]

    return (
      <Dialog
        open={dialogVisible}
        actions={actions}
        bodyStyle={{display: 'flex', overflow: 'visible'}}
        onRequestClose={onClose}
        >
        <div style={{ flex: 3 }}>
          <LayerList />
        </div>
        <div style={{ flex: 7, marginLeft: 15 }}>
          <LayerSettingsContainer layerId={selectedLayer} />
        </div>
      </Dialog>
    )
  }

  removeSelectedLayer_ () {
    const { selectedLayer, onRemoveLayer } = this.props
    onRemoveLayer(selectedLayer)
  }
}

LayersDialogPresentation.propTypes = {
  dialogVisible: PropTypes.bool.isRequired,
  selectedLayer: PropTypes.string,
  visibleSource: PropTypes.string,

  onClose: PropTypes.func,
  onRemoveLayer: PropTypes.func
}

LayersDialogPresentation.defaultProps = {
  dialogVisible: false
}

/**
 * Container of the dialog that allows the user to configure the layers of
 * the map.
 */
const LayersDialog = connect(
  // mapStateToProps
  state => ({
    dialogVisible: state.dialogs.layerSettings.dialogVisible,
    selectedLayer: state.dialogs.layerSettings.selectedLayer,
    visibleSource: state.map.layers.byId.base.parameters.source
  }),
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeLayersDialog())
    },

    onRemoveLayer (layerId) {
      dispatch(removeLayer(layerId))
    }
  })
)(LayersDialogPresentation)

export default LayersDialog
