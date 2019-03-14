import * as React from 'react';
import { connect } from 'react-redux';
import { db } from 'services/firebase';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core';
import { ReduxState } from 'services/types';
import { RemoteData, InStoreApi, ShopApi } from 'common/types';
import Container from 'components/Container';
import Typography from '@material-ui/core/Typography';

interface State {
    rentals: RemoteData<InStoreApi[]>,
    startDate: string,
    endDate: string
}

interface StateToProps {
    shop: ShopApi,
}

type Props = StateToProps & WithStyles<typeof styles>;

class Reports extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            rentals: { kind: 'LOADING' },
            startDate: '2019-01-16',
            endDate: '2019-01-31'
        };
    }

    componentDidMount() {
        this.getRentals();
    }

    getRentals() {
        const shopId = this.props.shop.id;
        const rentalsRef = db.collection('rentals')
            .where('shopId', '==', shopId)
            .where('rentalState', '==', 'COMPLETED')
            .where('endDate', '>=', this.state.startDate)
            .orderBy('endDate', 'asc');
        rentalsRef.get().then((querySnapshot) => {
            const rentalList: InStoreApi[] = [];
            for (const rentalDoc of querySnapshot.docs) {
                const rental = rentalDoc.data() as InStoreApi;
                rentalList.push(rental);
            }
            const rentals: RemoteData<InStoreApi[]> = { kind: 'FETCHED', data: rentalList };
            this.setState({
                rentals
            });
            console.log(this.state.rentals);
        }, (error) => {
            const rentals: RemoteData<InStoreApi[]> = { kind: 'ERROR', error: error.message };
            this.setState({
                rentals
            });
        });
       
    }

    renderRentals() {
        const classes = this.props.classes;
        const rentals = this.state.rentals;
        if (rentals.kind === 'LOADING') {
            return <div>Loading</div>;
        }
        if (rentals.kind === 'ERROR') {
            return <div>{rentals.error}</div>;
        }
        
        const rentalData = rentals.data;

        const rentalDataRows = rentalData.map((rental) => {
            const responsiblePerson = rental.responsiblePerson;
            const name = responsiblePerson.firstName + ' ' + responsiblePerson.lastName;
            const date = rental.endDate;
            const price = rental.charge.amount;
            const priceString = (price / 100).toFixed(2);
            return (
                <tr key={rental.id}>
                    <td>{name}</td>
                    <td>{date}</td>
                    <td>{priceString}</td>
                </tr>
            );
        });

        return (
            <table>
                <thead className={classes.leftAlign}>
                    <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Amount</th>
                    </tr>
                </thead>
            <tbody>
                {rentalDataRows}
            </tbody>
            </table>
        );
    }

    setDate = (e: any) => {
        if (e.target.name === 'startDate') {
            this.setState({
                startDate: e.target.value
            });
        } else {
            this.setState({
                endDate: e.target.value
            });
        }
    }

    render() {
        const classes = this.props.classes;
        return (
            <Container>
                <Typography variant="h5" gutterBottom className={classes.header}>
                    Dummy report
                </Typography>
                <input name="startDate" type="date" onChange={this.setDate}/>
                <input name="endDate" type="date" onChange={this.setDate}/>
                {this.renderRentals()}
            </Container>
        );
    }
}

const mapStateToProps = ({ shops}: ReduxState): StateToProps => {
    const { activeShop } = shops;
    return { shop: activeShop! };
};

const styles = (theme: Theme) => createStyles({
    header: {
        marginBottom: 32,
    },
    leftAlign: {
        textAlign: 'left',
    },
});

export default withStyles(styles)(connect(mapStateToProps, {})(Reports));
