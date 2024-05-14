/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: "/home",
                destination: "/create",
                permanent: true
            }
        ]
    }
};

export default nextConfig;