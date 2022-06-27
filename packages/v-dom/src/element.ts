class Element {
  private type: any
  private props: any
  private children: string[]

  constructor(type, props, children) {
    this.type = type
    this.props = props
    this.children = children
  }
}

export default Element