import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import Helmet from "react-helmet";

import createConfig from "./create-config";
import configureCMS from "./configure-cms";

const waitForGlobal = function(key, callback) {
  if (window[key]) {
    callback();
  } else {
    setTimeout(function() {
      waitForGlobal(key, callback);
    }, 100);
  }
};

export default ({ data, pageContext }) => {
  useEffect(() => {
    if (typeof window !== undefined) {
      window.React = React;
      window.ReactDOM = ReactDOM;
      const config = createConfig({ data, pageContext });

      waitForGlobal("NetlifyCmsApp", () => {
        const CMS = window.NetlifyCmsApp;
        configureCMS({ CMS, data, pageContext, config });
        CMS.init({ config });
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Helmet>
        <title>{pageContext.htmlTitle}</title>
        <script src={"/netlify-cms-app.js"} />
      </Helmet>
      <div id="nc-root" />
    </>
  );
};
