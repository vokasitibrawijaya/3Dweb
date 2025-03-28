class URDFParser {
    constructor() {
        this.links = new Map();
        this.joints = new Map();
        this.materials = new Map();
    }

    parseURDF(urdfString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(urdfString, 'text/xml');
        const robot = doc.getElementsByTagName('robot')[0];

        // Parse materials
        const materials = robot.getElementsByTagName('material');
        for (const material of materials) {
            const name = material.getAttribute('name');
            const color = material.getElementsByTagName('color')[0].getAttribute('rgba');
            const [r, g, b, a] = color.split(' ').map(Number);
            this.materials.set(name, new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(r, g, b),
                transparent: a !== 1,
                opacity: a
            }));
        }

        // Parse links
        const links = robot.getElementsByTagName('link');
        for (const link of links) {
            const name = link.getAttribute('name');
            const visual = link.getElementsByTagName('visual')[0];
            const geometry = visual.getElementsByTagName('geometry')[0];
            const materialName = visual.getElementsByTagName('material')[0].getAttribute('name');
            
            let mesh;
            if (geometry.getElementsByTagName('box').length > 0) {
                const size = geometry.getElementsByTagName('box')[0].getAttribute('size').split(' ').map(Number);
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(size[0], size[1], size[2]),
                    this.materials.get(materialName)
                );
            } else if (geometry.getElementsByTagName('cylinder').length > 0) {
                const radius = parseFloat(geometry.getElementsByTagName('cylinder')[0].getAttribute('radius'));
                const length = parseFloat(geometry.getElementsByTagName('cylinder')[0].getAttribute('length'));
                mesh = new THREE.Mesh(
                    new THREE.CylinderGeometry(radius, radius, length, 32),
                    this.materials.get(materialName)
                );
            }

            const group = new THREE.Group();
            group.add(mesh);
            this.links.set(name, group);
        }

        // Parse joints
        const joints = robot.getElementsByTagName('joint');
        for (const joint of joints) {
            const name = joint.getAttribute('name');
            const type = joint.getAttribute('type');
            const parent = joint.getElementsByTagName('parent')[0].getAttribute('link');
            const child = joint.getElementsByTagName('child')[0].getAttribute('link');
            const axis = joint.getElementsByTagName('axis')[0].getAttribute('xyz').split(' ').map(Number);
            const limit = joint.getElementsByTagName('limit')[0];

            this.joints.set(name, {
                type,
                parent,
                child,
                axis,
                lower: parseFloat(limit.getAttribute('lower')),
                upper: parseFloat(limit.getAttribute('upper')),
                effort: parseFloat(limit.getAttribute('effort')),
                velocity: parseFloat(limit.getAttribute('velocity'))
            });
        }

        return this.buildRobot();
    }

    buildRobot() {
        // Find root link (base_link)
        const rootLink = this.links.get('base_link');
        if (!rootLink) return null;

        // Build joint hierarchy
        for (const [jointName, joint] of this.joints) {
            const parentLink = this.links.get(joint.parent);
            const childLink = this.links.get(joint.child);
            
            if (parentLink && childLink) {
                // Position child link relative to parent
                childLink.position.set(0, 0.15, 0); // Adjust based on joint position
                
                // Add child to parent
                parentLink.add(childLink);
            }
        }

        return rootLink;
    }
} 