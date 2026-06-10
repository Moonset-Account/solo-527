declare module 'proxy-addr' {
  type Address = string
  type Addresses = Address[]
  type Netmask = string

  interface AddressHandler {
    (addr: string, i: number): boolean | string | void
  }

  export function compile(
    values: string | string[]
  ): (addr: string, i: number) => boolean
}
