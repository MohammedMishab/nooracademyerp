import withPWA from "next-pwa";

const nextConfig = {
  // your next config here
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);
