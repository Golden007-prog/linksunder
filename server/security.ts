import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
export function localHost(host: string) { return ['127.0.0.1','localhost','[::1]','::1'].includes(host.toLowerCase()); }
export function publicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a,b] = ip.split('.').map(Number);
    return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19)));
  }
  // Conservatively accept global unicast IPv6 only; reject mapped IPv4 and local ranges.
  return isIP(ip)===6 && /^[23][0-9a-f]{3}:/i.test(ip);
}
export async function validateTarget(raw: string, consent: boolean, localOrigin?: string) {
  const u = new URL(raw);
  if (!['http:','https:'].includes(u.protocol)||u.username||u.password) throw new Error('Only HTTP(S) URLs without embedded credentials are allowed.');
  if (localOrigin && u.origin===localOrigin) return u;
  if (localOrigin && localHost(u.hostname)) throw new Error('Requests to other local origins are blocked.');
  if (localHost(u.hostname)) return u;
  if (!consent) throw new Error('Confirm that you own or have permission to test this external site.');
  const ips = await lookup(u.hostname, {all:true});
  if (!ips.length || ips.some(x=>!publicAddress(x.address))) throw new Error('Private, metadata, and reserved network targets are blocked.');
  return u;
}
