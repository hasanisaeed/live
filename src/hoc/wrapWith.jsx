import PropTypes from 'prop-types';
import React from 'react';
import wrapDisplayName from 'recompose/wrapDisplayName';

export default WrapperComponent => BaseComponent => {
  const result = ({ children, ...restProps }) => (
    <WrapperComponent>
      <BaseComponent {...restProps}>{children}</BaseComponent>
    </WrapperComponent>
  );
  result.propTypes = {
    children: PropTypes.node
  };
  result.displayName = wrapDisplayName(
    BaseComponent,
    wrapDisplayName(WrapperComponent, 'wrapWith')
  );
  return result;
};
